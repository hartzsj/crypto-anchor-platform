import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TronAdapter } from './tron.adapter';
import { BscAdapter } from './bsc.adapter';
import {
  BlockchainAdapter,
  BlockchainType,
  EscrowStatus,
  EscrowOrderInfo,
  TokenInfo,
} from './blockchain.interface';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private adapters: Map<BlockchainType, BlockchainAdapter>;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tronAdapter: TronAdapter,
    private bscAdapter: BscAdapter,
  ) {
    this.adapters = new Map();
  }

  async onModuleInit() {
    // 注册适配器
    this.adapters.set(BlockchainType.TRON, this.tronAdapter);
    this.adapters.set(BlockchainType.BSC, this.bscAdapter);

    // 初始化区块链网络配置（如果不存在）
    await this.initializeNetworks();
  }

  private async initializeNetworks() {
    // 检查是否已存在网络配置
    const existingNetworks = await this.prisma.blockchainNetwork.count();

    if (existingNetworks === 0) {
      // 创建默认网络配置
      await this.prisma.blockchainNetwork.createMany({
        data: [
          {
            id: 'tron-main',
            name: 'TRON',
            displayName: 'TRON (TRC-20)',
            chainId: null,
            rpcUrl: this.configService.get('TRON_RPC_URL', 'https://api.trongrid.io'),
            isActive: true,
          },
          {
            id: 'bsc-main',
            name: 'BSC',
            displayName: 'BSC (BEP-20)',
            chainId: '56',
            rpcUrl: this.configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
            isActive: true,
          },
        ],
      });

      // 创建默认代币配置
      const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
        where: { name: 'TRON' },
      });
      const bscNetwork = await this.prisma.blockchainNetwork.findFirst({
        where: { name: 'BSC' },
      });

      if (tronNetwork) {
        await this.prisma.token.createMany({
          data: [
            {
              networkId: tronNetwork.id,
              symbol: 'TRX',
              name: 'TRON',
              contractAddress: null,
              decimals: 6,
              isNative: true,
              isActive: true,
            },
            {
              networkId: tronNetwork.id,
              symbol: 'USDT',
              name: 'Tether USD',
              contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
              decimals: 6,
              isNative: false,
              isActive: true,
            },
          ],
        });
      }

      if (bscNetwork) {
        await this.prisma.token.createMany({
          data: [
            {
              networkId: bscNetwork.id,
              symbol: 'BNB',
              name: 'Binance Coin',
              contractAddress: null,
              decimals: 18,
              isNative: true,
              isActive: true,
            },
            {
              networkId: bscNetwork.id,
              symbol: 'USDT',
              name: 'Tether USD',
              contractAddress: '0x55d398326f99059fF775485246999027B3197955',
              decimals: 18,
              isNative: false,
              isActive: true,
            },
            {
              networkId: bscNetwork.id,
              symbol: 'ETH',
              name: 'Ethereum (BEP-20)',
              contractAddress: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
              decimals: 18,
              isNative: false,
              isActive: true,
            },
          ],
        });
      }
    }
  }

  /**
   * 获取指定链的适配器
   */
  getAdapter(networkType: BlockchainType): BlockchainAdapter {
    const adapter = this.adapters.get(networkType);
    if (!adapter) {
      throw new Error(`Blockchain adapter not found for ${networkType}`);
    }
    return adapter;
  }

  /**
   * 获取所有支持的网络
   */
  async getSupportedNetworks() {
    return this.prisma.blockchainNetwork.findMany({
      where: { isActive: true },
      include: { tokens: { where: { isActive: true } } },
    });
  }

  /**
   * 获取指定网络和代币的信息
   */
  async getToken(networkName: string, symbol: string): Promise<TokenInfo | null> {
    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName, isActive: true },
    });

    if (!network) return null;

    const token = await this.prisma.token.findFirst({
      where: {
        networkId: network.id,
        symbol: symbol,
        isActive: true,
      },
    });

    if (!token) return null;

    return {
      symbol: token.symbol,
      name: token.name,
      contractAddress: token.contractAddress || '',
      decimals: token.decimals,
      isNative: token.isNative,
    };
  }

  /**
   * 创建链上托管订单
   */
  async createOnchainEscrow(
    orderId: string,
    networkType: BlockchainType,
    buyerAddress: string,
    sellerAddress: string,
    amount: string,
    tokenSymbol: string,
  ) {
    const adapter = this.getAdapter(networkType);
    const token = await this.getToken(networkType, tokenSymbol);

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
    }

    // 获取合约配置
    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkType },
      include: { escrowContracts: { where: { isActive: true }, take: 1 } },
    });

    if (!network || network.escrowContracts.length === 0) {
      throw new Error(`No escrow contract configured for ${networkType}`);
    }

    // 调用适配器创建订单
    const result = await adapter.createEscrowOrder(
      orderId,
      buyerAddress,
      sellerAddress,
      amount,
      token,
    );

    // 保存链上订单记录
    await this.prisma.onchainOrder.create({
      data: {
        orderId,
        networkId: network.id,
        contractId: network.escrowContracts[0].id,
        escrowId: result.escrowId,
        buyerAddress,
        sellerAddress,
        amount,
        tokenId: await this.get tokenIdFromSymbol(networkType, tokenSymbol),
        status: 'CREATED',
      },
    });

    return result;
  }

  /**
   * 充值托管订单
   */
  async fundOnchainEscrow(
    orderId: string,
    networkType: BlockchainType,
    buyerAddress: string,
    amount: string,
    tokenSymbol: string,
  ) {
    const adapter = this.getAdapter(networkType);
    const token = await this.getToken(networkType, tokenSymbol);

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
    }

    const result = await adapter.fundEscrowOrder(orderId, buyerAddress, amount, token);

    // 更新链上订单状态
    await this.prisma.onchainOrder.update({
      where: { orderId },
      data: {
        status: 'FUNDED',
        fundedTxHash: result.txHash,
      },
    });

    return result;
  }

  /**
   * 释放托管资金给卖家
   */
  async releaseOnchainEscrow(orderId: string, networkType: BlockchainType) {
    const adapter = this.getAdapter(networkType);

    const result = await adapter.releaseEscrow(orderId);

    // 更新链上订单状态
    await this.prisma.onchainOrder.update({
      where: { orderId },
      data: {
        status: 'RELEASED',
        releaseTxHash: result.txHash,
      },
    });

    return result;
  }

  /**
   * 退款给买家
   */
  async refundOnchainEscrow(orderId: string, networkType: BlockchainType) {
    const adapter = this.getAdapter(networkType);

    const result = await adapter.refundEscrow(orderId);

    // 更新链上订单状态
    await this.prisma.onchainOrder.update({
      where: { orderId },
      data: {
        status: 'REFUNDED',
        refundTxHash: result.txHash,
      },
    });

    return result;
  }

  /**
   * 查询链上订单状态
   */
  async getOnchainEscrowStatus(orderId: string, networkType: BlockchainType): Promise<EscrowStatus> {
    const adapter = this.getAdapter(networkType);
    return adapter.getEscrowStatus(orderId);
  }

  /**
   * 查询链上余额
   */
  async getOnchainBalance(
    address: string,
    networkType: BlockchainType,
    tokenSymbol: string,
  ): Promise<string> {
    const adapter = this.getAdapter(networkType);
    const token = await this.getToken(networkType, tokenSymbol);

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
    }

    return adapter.getBalance(address, token);
  }

  /**
   * 验证地址格式
   */
  isValidAddress(address: string, networkType: BlockchainType): boolean {
    const adapter = this.getAdapter(networkType);
    return adapter.isValidAddress(address);
  }

  private async getTokenIdFromSymbol(networkType: BlockchainType, symbol: string): Promise<string> {
    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkType },
    });

    if (!network) throw new Error(`Network ${networkType} not found`);

    const token = await this.prisma.token.findFirst({
      where: { networkId: network.id, symbol },
    });

    if (!token) throw new Error(`Token ${symbol} not found on ${networkType}`);

    return token.id;
  }
}
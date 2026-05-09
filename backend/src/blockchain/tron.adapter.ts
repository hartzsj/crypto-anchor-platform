import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TronWeb from 'tronweb';
import {
  BlockchainAdapter,
  BlockchainType,
  EscrowStatus,
  EscrowOrderInfo,
  TokenInfo,
  BlockchainNetworkConfig,
} from './blockchain.interface';

@Injectable()
export class TronAdapter implements BlockchainAdapter, OnModuleInit {
  private tronWeb: TronWeb;
  private contract: any;
  private config: BlockchainNetworkConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      name: BlockchainType.TRON,
      displayName: 'TRON (TRC-20)',
      chainId: null,
      rpcUrl: configService.get('TRON_RPC_URL', 'https://api.trongrid.io'),
      escrowContractAddress: configService.get('TRON_ESCROW_ADDRESS', ''),
      escrowContractAbi: null,
    };
  }

  async onModuleInit() {
    // 初始化 TronWeb
    this.tronWeb = new TronWeb({
      fullHost: this.config.rpcUrl,
      privateKey: this.configService.get('TRON_PRIVATE_KEY', ''),
    });

    // 如果有合约地址，加载合约
    if (this.config.escrowContractAddress) {
      // 从部署文件加载 ABI
      const abi = await this.loadContractAbi();
      this.contract = await this.tronWeb.contract(abi, this.config.escrowContractAddress);
    }
  }

  private async loadContractAbi(): Promise<any> {
    // TODO: 从 deployments/tron-shasta.json 加载 ABI
    // 简化版：返回基本 ABI
    return [
      {
        name: 'createOrder',
        inputs: [
          { name: '_orderId', type: 'bytes32' },
          { name: '_buyer', type: 'address' },
          { name: '_seller', type: 'address' },
          { name: '_amount', type: 'uint256' },
          { name: '_token', type: 'address' },
        ],
        outputs: [],
      },
      {
        name: 'fundOrder',
        inputs: [{ name: '_orderId', type: 'bytes32' }],
        outputs: [],
      },
      {
        name: 'release',
        inputs: [{ name: '_orderId', type: 'bytes32' }],
        outputs: [],
      },
      {
        name: 'refund',
        inputs: [{ name: '_orderId', type: 'bytes32' }],
        outputs: [],
      },
      {
        name: 'getOrder',
        inputs: [{ name: '_orderId', type: 'bytes32' }],
        outputs: [
          { name: 'buyer', type: 'address' },
          { name: 'seller', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'fundedAt', type: 'uint256' },
        ],
      },
      {
        name: 'getOrderStatus',
        inputs: [{ name: '_orderId', type: 'bytes32' }],
        outputs: [{ name: '', type: 'uint8' }],
      },
    ];
  }

  getNetworkName(): BlockchainType {
    return BlockchainType.TRON;
  }

  getChainId(): string | null {
    return null; // TRON 没有 chainId
  }

  async createEscrowOrder(
    orderId: string,
    buyerAddress: string,
    sellerAddress: string,
    amount: string,
    token: TokenInfo,
  ): Promise<{ escrowId: string; txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    // 转换地址格式
    const buyerHex = this.tronWeb.address.toHex(buyerAddress);
    const sellerHex = this.tronWeb.address.toHex(sellerAddress);
    const tokenHex = token.isNative ? '0x0000000000000000000000000000000000000000' : this.tronWeb.address.toHex(token.contractAddress);

    // 转换 orderId 为 bytes32
    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);

    // 调用合约
    const tx = await this.contract.createOrder(
      orderIdHex,
      buyerHex,
      sellerHex,
      this.tronWeb.utils.toSun(amount),
      tokenHex,
    ).send({
      feeLimit: 100_000_000, // 100 SUN
    });

    return {
      escrowId: orderId,
      txHash: tx,
    };
  }

  async fundEscrowOrder(
    orderId: string,
    buyerAddress: string,
    amount: string,
    token: TokenInfo,
  ): Promise<{ txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
    const amountSun = this.tronWeb.utils.toSun(amount);

    if (token.isNative) {
      // TRX 充值
      const tx = await this.contract.fundOrder(orderIdHex).send({
        callValue: amountSun,
        feeLimit: 100_000_000,
      });
      return { txHash: tx };
    } else {
      // USDT 充值需要先 approve
      // TODO: 实现 USDT approve + fundOrder
      throw new Error('TRC-20 token funding requires approval first');
    }
  }

  async releaseEscrow(orderId: string): Promise<{ txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);

    const tx = await this.contract.release(orderIdHex).send({
      feeLimit: 100_000_000,
    });

    return { txHash: tx };
  }

  async refundEscrow(orderId: string): Promise<{ txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);

    const tx = await this.contract.refund(orderIdHex).send({
      feeLimit: 100_000_000,
    });

    return { txHash: tx };
  }

  async getEscrowOrder(orderId: string): Promise<EscrowOrderInfo> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);

    const result = await this.contract.getOrder(orderIdHex).call();

    return {
      orderId,
      buyerAddress: this.tronWeb.address.fromHex(result.buyer),
      sellerAddress: this.tronWeb.address.fromHex(result.seller),
      amount: this.tronWeb.utils.fromSun(result.amount),
      tokenAddress: result.token === '0x0000000000000000000000000000000000000000'
        ? 'TRX'
        : this.tronWeb.address.fromHex(result.token),
      status: this.parseEscrowStatus(result.status),
      createdAt: Number(result.createdAt),
      fundedAt: Number(result.fundedAt),
    };
  }

  async getEscrowStatus(orderId: string): Promise<EscrowStatus> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);

    const status = await this.contract.getOrderStatus(orderIdHex).call();

    return this.parseEscrowStatus(status);
  }

  async getBalance(address: string, token: TokenInfo): Promise<string> {
    if (token.isNative) {
      // TRX 余额
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.utils.fromSun(balance);
    } else {
      // TRC-20 代币余额
      const tokenContract = await this.tronWeb.contract().at(token.contractAddress);
      const balance = await tokenContract.balanceOf(address).call();
      return this.tronWeb.utils.fromSun(balance);
    }
  }

  isValidAddress(address: string): boolean {
    return this.tronWeb.utils.validation.isValidAddress(address);
  }

  async getTransaction(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber: number | null;
    timestamp: number | null;
  }> {
    const tx = await this.tronWeb.trx.getTransactionInfo(txHash);

    if (!tx || !tx.blockNumber) {
      return {
        status: 'pending',
        blockNumber: null,
        timestamp: null,
      };
    }

    // 检查交易是否成功
    const block = await this.tronWeb.trx.getBlockByNumber(tx.blockNumber);

    return {
      status: 'confirmed',
      blockNumber: Number(tx.blockNumber),
      timestamp: Number(block.block_header.raw_data.timestamp),
    };
  }

  private parseEscrowStatus(status: number): EscrowStatus {
    switch (status) {
      case 0:
        return EscrowStatus.CREATED;
      case 1:
        return EscrowStatus.FUNDED;
      case 2:
        return EscrowStatus.RELEASED;
      case 3:
        return EscrowStatus.REFUNDED;
      default:
        throw new Error(`Unknown escrow status: ${status}`);
    }
  }
}
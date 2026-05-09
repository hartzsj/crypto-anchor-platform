import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet } from 'ethers';
import {
  BlockchainAdapter,
  BlockchainType,
  EscrowStatus,
  EscrowOrderInfo,
  TokenInfo,
  BlockchainNetworkConfig,
} from './blockchain.interface';

@Injectable()
export class BscAdapter implements BlockchainAdapter, OnModuleInit {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;
  private config: BlockchainNetworkConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      name: BlockchainType.BSC,
      displayName: 'BSC (BEP-20)',
      chainId: '56', // BSC Mainnet, Testnet: '97'
      rpcUrl: configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
      escrowContractAddress: configService.get('BSC_ESCROW_ADDRESS', ''),
      escrowContractAbi: null,
    };
  }

  async onModuleInit() {
    // 初始化 Provider
    this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);

    // 初始化钱包（如果有私钥）
    const privateKey = this.configService.get('BSC_PRIVATE_KEY', '');
    if (privateKey) {
      this.wallet = new Wallet(privateKey, this.provider);
    }

    // 如果有合约地址，加载合约
    if (this.config.escrowContractAddress && this.wallet) {
      const abi = await this.loadContractAbi();
      this.contract = new Contract(
        this.config.escrowContractAddress,
        abi,
        this.wallet,
      );
    }
  }

  private async loadContractAbi(): Promise<any> {
    // TODO: 从 deployments/bsc-testnet.json 加载 ABI
    // 简化版：返回基本 ABI
    return [
      'function createOrder(bytes32 _orderId, address _buyer, address _seller, uint256 _amount, address _token)',
      'function fundOrder(bytes32 _orderId)',
      'function release(bytes32 _orderId)',
      'function refund(bytes32 _orderId)',
      'function getOrder(bytes32 _orderId) returns (address buyer, address seller, uint256 amount, address token, uint8 status, uint256 createdAt, uint256 fundedAt)',
      'function getOrderStatus(bytes32 _orderId) returns (uint8)',
      'function admin() returns (address)',
      'event OrderCreated(bytes32 orderId, address buyer, address seller, uint256 amount, address token)',
      'event OrderFunded(bytes32 orderId, uint256 amount, uint256 fundedAt)',
      'event OrderReleased(bytes32 orderId, address seller, uint256 amount, uint256 releasedAt)',
      'event OrderRefunded(bytes32 orderId, address buyer, uint256 amount, uint256 refundedAt)',
    ];
  }

  getNetworkName(): BlockchainType {
    return BlockchainType.BSC;
  }

  getChainId(): string | null {
    return this.config.chainId;
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

    // 转换 orderId 为 bytes32
    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);

    // 转换金额（wei）
    const amountWei = ethers.utils.parseUnits(amount, token.decimals);

    // token 地址（原生币用零地址）
    const tokenAddress = token.isNative ? ethers.constants.AddressZero : token.contractAddress;

    // 调用合约
    const tx = await this.contract.createOrder(
      orderIdBytes32,
      buyerAddress,
      sellerAddress,
      amountWei,
      tokenAddress,
    );

    const receipt = await tx.wait();

    return {
      escrowId: orderId,
      txHash: receipt.transactionHash,
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

    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);
    const amountWei = ethers.utils.parseUnits(amount, token.decimals);

    if (token.isNative) {
      // BNB 充值
      const tx = await this.contract.fundOrder(orderIdBytes32, {
        value: amountWei,
      });
      const receipt = await tx.wait();
      return { txHash: receipt.transactionHash };
    } else {
      // BEP-20 代币充值需要先 approve
      // TODO: 实现 approve + fundOrder
      throw new Error('BEP-20 token funding requires approval first');
    }
  }

  async releaseEscrow(orderId: string): Promise<{ txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);

    const tx = await this.contract.release(orderIdBytes32);
    const receipt = await tx.wait();

    return { txHash: receipt.transactionHash };
  }

  async refundEscrow(orderId: string): Promise<{ txHash: string }> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);

    const tx = await this.contract.refund(orderIdBytes32);
    const receipt = await tx.wait();

    return { txHash: receipt.transactionHash };
  }

  async getEscrowOrder(orderId: string): Promise<EscrowOrderInfo> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);

    const result = await this.contract.getOrder(orderIdBytes32);

    return {
      orderId,
      buyerAddress: result.buyer,
      sellerAddress: result.seller,
      amount: ethers.utils.formatUnits(result.amount, 18),
      tokenAddress: result.token === ethers.constants.AddressZero ? 'BNB' : result.token,
      status: this.parseEscrowStatus(result.status),
      createdAt: Number(result.createdAt),
      fundedAt: Number(result.fundedAt),
    };
  }

  async getEscrowStatus(orderId: string): Promise<EscrowStatus> {
    if (!this.contract) {
      throw new Error('Escrow contract not initialized');
    }

    const orderIdBytes32 = ethers.utils.formatBytes32String(orderId);

    const status = await this.contract.getOrderStatus(orderIdBytes32);

    return this.parseEscrowStatus(status);
  }

  async getBalance(address: string, token: TokenInfo): Promise<string> {
    if (token.isNative) {
      // BNB 余额
      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } else {
      // BEP-20 代币余额
      const tokenContract = new Contract(
        token.contractAddress,
        ['function balanceOf(address) returns (uint256)'],
        this.provider,
      );
      const balance = await tokenContract.balanceOf(address);
      return ethers.utils.formatUnits(balance, token.decimals);
    }
  }

  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  async getTransaction(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber: number | null;
    timestamp: number | null;
  }> {
    const tx = await this.provider.getTransaction(txHash);

    if (!tx) {
      return {
        status: 'pending',
        blockNumber: null,
        timestamp: null,
      };
    }

    if (!tx.blockNumber) {
      return {
        status: 'pending',
        blockNumber: null,
        timestamp: null,
      };
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (receipt.status === 0) {
      return {
        status: 'failed',
        blockNumber: tx.blockNumber,
        timestamp: null,
      };
    }

    const block = await this.provider.getBlock(tx.blockNumber);

    return {
      status: 'confirmed',
      blockNumber: tx.blockNumber,
      timestamp: block.timestamp,
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
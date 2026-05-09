// 区块链适配器接口
export enum BlockchainType {
  TRON = 'TRON',
  BSC = 'BSC',
}

export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

export interface EscrowOrderInfo {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  tokenAddress: string;
  status: EscrowStatus;
  createdAt: number;
  fundedAt: number;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  isNative: boolean;
}

export interface BlockchainAdapter {
  // 网络信息
  getNetworkName(): BlockchainType;
  getChainId(): string | null;

  // 托管订单操作
  createEscrowOrder(
    orderId: string,
    buyerAddress: string,
    sellerAddress: string,
    amount: string,
    token: TokenInfo,
  ): Promise<{ escrowId: string; txHash: string }>;

  fundEscrowOrder(
    orderId: string,
    buyerAddress: string,
    amount: string,
    token: TokenInfo,
  ): Promise<{ txHash: string }>;

  releaseEscrow(orderId: string): Promise<{ txHash: string }>;

  refundEscrow(orderId: string): Promise<{ txHash: string }>;

  getEscrowOrder(orderId: string): Promise<EscrowOrderInfo>;

  getEscrowStatus(orderId: string): Promise<EscrowStatus>;

  // 余额查询
  getBalance(address: string, token: TokenInfo): Promise<string>;

  // 地址验证
  isValidAddress(address: string): boolean;

  // 交易查询
  getTransaction(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber: number | null;
    timestamp: number | null;
  }>;
}

// 区块链网络配置
export interface BlockchainNetworkConfig {
  name: BlockchainType;
  displayName: string;
  chainId: string | null;
  rpcUrl: string;
  escrowContractAddress: string;
  escrowContractAbi: any;
}
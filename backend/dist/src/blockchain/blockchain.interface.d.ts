export declare enum BlockchainType {
    TRON = "TRON",
    BSC = "BSC"
}
export declare enum EscrowStatus {
    CREATED = "CREATED",
    FUNDED = "FUNDED",
    RELEASED = "RELEASED",
    REFUNDED = "REFUNDED"
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
    getNetworkName(): BlockchainType;
    getChainId(): string | null;
    createEscrowOrder(orderId: string, buyerAddress: string, sellerAddress: string, amount: string, token: TokenInfo): Promise<{
        escrowId: string;
        txHash: string;
    }>;
    fundEscrowOrder(orderId: string, buyerAddress: string, amount: string, token: TokenInfo): Promise<{
        txHash: string;
    }>;
    releaseEscrow(orderId: string): Promise<{
        txHash: string;
    }>;
    refundEscrow(orderId: string): Promise<{
        txHash: string;
    }>;
    getEscrowOrder(orderId: string): Promise<EscrowOrderInfo>;
    getEscrowStatus(orderId: string): Promise<EscrowStatus>;
    getBalance(address: string, token: TokenInfo): Promise<string>;
    isValidAddress(address: string): boolean;
    getTransaction(txHash: string): Promise<{
        status: 'pending' | 'confirmed' | 'failed';
        blockNumber: number | null;
        timestamp: number | null;
    }>;
}
export interface BlockchainNetworkConfig {
    name: BlockchainType;
    displayName: string;
    chainId: string | null;
    rpcUrl: string;
    escrowContractAddress: string;
    escrowContractAbi: any;
}

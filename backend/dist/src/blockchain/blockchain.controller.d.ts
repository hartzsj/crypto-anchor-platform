import { BlockchainService } from './blockchain.service';
import { DepositMonitorService } from './deposit-monitor.service';
export declare class BlockchainController {
    private readonly blockchainService;
    private readonly depositMonitor;
    constructor(blockchainService: BlockchainService, depositMonitor: DepositMonitorService);
    getNetworks(): Promise<({
        tokens: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            networkId: string;
            contractAddress: string | null;
            decimals: number;
            isNative: boolean;
            isActive: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        displayName: string;
        chainId: string | null;
        rpcUrl: string;
    })[]>;
    getTokens(network: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        networkId: string;
        contractAddress: string | null;
        decimals: number;
        isNative: boolean;
        isActive: boolean;
    }[]>;
    getBalance(address: string, network: string, token: string): Promise<{
        balance: string;
    }>;
    validateAddress(body: {
        address: string;
        network: string;
    }): Promise<{
        valid: boolean;
    }>;
    getWalletAddress(req: any, network: string): Promise<{
        address: string | null;
    }>;
    setWalletAddress(req: any, body: {
        network: string;
        address: string;
    }): Promise<{
        success: boolean;
    }>;
    createEscrow(req: any, body: {
        orderId: string;
        network: string;
        buyerAddress: string;
        sellerAddress: string;
        amount: string;
        token: string;
    }): Promise<{
        escrowId: string;
        txHash: string;
    }>;
    fundEscrow(req: any, body: {
        orderId: string;
        network: string;
        amount: string;
        token: string;
    }): Promise<{
        txHash: string;
    }>;
    getEscrowStatus(orderId: string, network: string): Promise<import("./blockchain.interface").EscrowStatus>;
    getDepositBalance(req: any, network: string): Promise<{
        balances: {};
        address: null;
    } | {
        balances: Record<string, number>;
        address: string;
    }>;
}

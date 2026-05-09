import { PrismaService } from '../prisma/prisma.service';
export declare class WalletsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrCreateWallet(userId: string): Promise<{
        balances: ({
            token: {
                network: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    displayName: string;
                    chainId: string | null;
                    rpcUrl: string;
                };
            } & {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tokenId: string;
            walletId: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            frozenBalance: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    getBalance(userId: string): Promise<{
        balances: {
            id: string;
            symbol: string;
            network: string;
            balance: number;
            frozenBalance: number;
            decimals: number;
        }[];
    }>;
    getTokenBalance(userId: string, networkName: string, tokenSymbol: string): Promise<{
        balance: number;
        frozenBalance: number;
    }>;
    deposit(userId: string, amount: number, networkName: string, tokenSymbol: string, txHash?: string, description?: string): Promise<{
        balance: number;
    }>;
    withdraw(userId: string, amount: number, address: string, networkName: string, tokenSymbol: string): Promise<{
        balance: number;
    }>;
    freezeFunds(userId: string, amount: number, networkName: string, tokenSymbol: string): Promise<void>;
    releaseFunds(userId: string, amount: number, networkName: string, tokenSymbol: string): Promise<void>;
    transferToSeller(buyerId: string, sellerId: string, amount: number, orderId: string, networkName: string, tokenSymbol: string): Promise<void>;
    refund(userId: string, amount: number, orderId: string, networkName: string, tokenSymbol: string): Promise<void>;
    getTransactions(userId: string, skip?: number, take?: number): Promise<{
        id: string;
        createdAt: Date;
        orderId: string | null;
        description: string | null;
        tokenId: string | null;
        walletId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        balanceBefore: import("@prisma/client/runtime/library").Decimal;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
        txHash: string | null;
    }[]>;
}

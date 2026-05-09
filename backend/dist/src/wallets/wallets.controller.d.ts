import { WalletsService } from './wallets.service';
export declare class WalletsController {
    private walletsService;
    constructor(walletsService: WalletsService);
    getBalance(req: any): Promise<{
        balances: {
            id: string;
            symbol: string;
            network: string;
            balance: number;
            frozenBalance: number;
            decimals: number;
        }[];
    }>;
    deposit(req: any, body: {
        amount: number;
        network?: string;
        token?: string;
        description?: string;
    }): Promise<{
        balance: number;
    }>;
    withdraw(req: any, body: {
        amount: number;
        address: string;
        network?: string;
        token?: string;
    }): Promise<{
        balance: number;
    }>;
    getTransactions(req: any, skip?: string, take?: string): Promise<{
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
    getTokenBalance(req: any, network: string, token: string): Promise<{
        balance: number;
        frozenBalance: number;
    }>;
}

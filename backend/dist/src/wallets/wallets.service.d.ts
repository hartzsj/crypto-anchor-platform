import { PrismaService } from '../prisma/prisma.service';
export declare class WalletsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrCreateWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    getBalance(userId: string): Promise<{
        balance: number;
        frozenBalance: number;
        total: number;
    }>;
    deposit(userId: string, amount: number, description?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    withdraw(userId: string, amount: number, address: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    freezeFunds(userId: string, amount: number): Promise<void>;
    releaseFunds(userId: string, amount: number): Promise<void>;
    transferToSeller(buyerId: string, sellerId: string, amount: number, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    refund(userId: string, amount: number, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    getTransactions(userId: string, skip?: number, take?: number): Promise<{
        id: string;
        createdAt: Date;
        orderId: string | null;
        description: string | null;
        walletId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        balanceBefore: import("@prisma/client/runtime/library").Decimal;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}

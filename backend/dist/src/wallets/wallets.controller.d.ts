import { WalletsService } from './wallets.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
export declare class WalletsController {
    private walletsService;
    constructor(walletsService: WalletsService);
    getBalance(req: any): Promise<{
        balance: number;
        frozenBalance: number;
        total: number;
    }>;
    deposit(req: any, body: DepositDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    withdraw(req: any, body: WithdrawDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        frozenBalance: import("@prisma/client/runtime/library").Decimal;
        depositAddress: string | null;
    }>;
    getTransactions(req: any): Promise<{
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

import { PrismaService } from '../prisma/prisma.service';
export declare class AdminController {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
        totalItems: number;
        totalOrders: number;
        pendingItems: number;
        disputedOrders: number;
        totalVolume: number;
        newUsersToday: number;
        newOrdersToday: number;
    }>;
    getAllOrders(status?: string, skip?: number, take?: number): Promise<{
        orders: ({
            item: {
                id: string;
                title: string;
                images: string[];
            };
            seller: {
                id: string;
                email: string;
                nickname: string;
            };
            buyer: {
                id: string;
                email: string;
                nickname: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            buyerId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            status: import("@prisma/client").$Enums.OrderStatus;
            itemId: string;
            logisticsCompany: string | null;
            trackingNumber: string | null;
            paidAt: Date | null;
            shippedAt: Date | null;
            completedAt: Date | null;
            canceledAt: Date | null;
            autoConfirmAt: Date | null;
        })[];
        total: number;
    }>;
    getDisputedOrders(): Promise<({
        item: {
            id: string;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
        };
        seller: {
            id: string;
            nickname: string;
            reputation: number;
        };
        buyer: {
            id: string;
            nickname: string;
            reputation: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sellerId: string;
        buyerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.OrderStatus;
        itemId: string;
        logisticsCompany: string | null;
        trackingNumber: string | null;
        paidAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        canceledAt: Date | null;
        autoConfirmAt: Date | null;
    })[]>;
    setUserRole(id: string, body: {
        role: 'USER' | 'ADMIN';
    }): Promise<{
        id: string;
        email: string;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    setUserReputation(id: string, body: {
        reputation: number;
    }): Promise<{
        id: string;
        nickname: string;
        reputation: number;
    }>;
    getAllUsers(skip?: number, take?: number): Promise<{
        users: {
            wallet: {
                balance: import("@prisma/client/runtime/library").Decimal;
                frozenBalance: import("@prisma/client/runtime/library").Decimal;
            } | null;
            id: string;
            email: string;
            username: string;
            avatar: string | null;
            nickname: string;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            createdAt: Date;
        }[];
        total: number;
    }>;
    getItemStats(): Promise<{
        byStatus: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ItemGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
        byCategory: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ItemGroupByOutputType, "category"[]> & {
            _count: number;
        })[];
    }>;
    getTransactions(skip?: number, take?: number): Promise<({
        wallet: {
            userId: string;
        };
        order: {
            item: {
                title: string;
            };
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        orderId: string | null;
        description: string | null;
        walletId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
        balanceBefore: import("@prisma/client/runtime/library").Decimal;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}

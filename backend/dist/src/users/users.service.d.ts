import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(email: string, username: string, password: string, nickname: string): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByUsername(username: string): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string): Promise<({
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            frozenBalance: import("@prisma/client/runtime/library").Decimal;
            depositAddress: string | null;
        } | null;
    } & {
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    updateReputation(userId: string, delta: number): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(skip?: number, take?: number): Promise<{
        id: string;
        email: string;
        username: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
    }[]>;
    updateRole(userId: string, role: 'USER' | 'ADMIN'): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: {
        nickname?: string;
        bio?: string;
        avatar?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        avatar: string | null;
        nickname: string;
        reputation: number;
    }>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    getUserStats(userId: string): Promise<{
        itemsCount: number;
        buyOrdersCount: number;
        sellOrdersCount: number;
        totalOrders: number;
        reviewsReceivedCount: number;
        reviewsGivenCount: number;
        avgRating: number;
        goodRate: number;
    }>;
    getPublicProfile(userId: string): Promise<{
        stats: {
            itemsCount: number;
            buyOrdersCount: number;
            sellOrdersCount: number;
            totalOrders: number;
            reviewsReceivedCount: number;
            reviewsGivenCount: number;
            avgRating: number;
            goodRate: number;
        };
        id: string;
        username: string;
        avatar: string | null;
        nickname: string;
        reputation: number;
        createdAt: Date;
    } | null>;
    getUserItems(userId: string, skip?: number, take?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sellerId: string;
        title: string;
        description: string;
        images: string[];
        price: import("@prisma/client/runtime/library").Decimal;
        category: string;
        location: string | null;
        serialNumber: string | null;
        status: import("@prisma/client").$Enums.ItemStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedReason: string | null;
    }[]>;
    getUserReviews(userId: string, skip?: number, take?: number): Promise<({
        order: {
            item: {
                id: string;
                title: string;
            };
        };
        reviewer: {
            id: string;
            avatar: string | null;
            nickname: string;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        reviewerId: string;
        revieweeId: string;
        rating: number;
        comment: string | null;
    })[]>;
}

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
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
        wallet?: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        } | null | undefined;
        id?: string | undefined;
        email?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        avatar?: string | null | undefined;
        nickname?: string | undefined;
        role?: import("@prisma/client").$Enums.Role | undefined;
        reputation?: number | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
    }>;
    updateProfile(req: any, body: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        username: string;
        avatar: string | null;
        nickname: string;
        reputation: number;
    }>;
    changePassword(req: any, body: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    getMyItems(req: any, skip?: number, take?: number): Promise<{
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
    getMyReviews(req: any, skip?: number, take?: number): Promise<({
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
    getPublicProfile(id: string): Promise<{
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
    getUserItems(id: string, skip?: number, take?: number): Promise<{
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
    getUserReviews(id: string, skip?: number, take?: number): Promise<({
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
    findAll(req: any, skip?: number, take?: number): Promise<{
        id: string;
        email: string;
        username: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
    }[]>;
}

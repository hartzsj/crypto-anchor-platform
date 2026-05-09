import { PrismaService } from '../prisma/prisma.service';
export declare class ItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(sellerId: string, title: string, description: string, images: string[], price: number, category: string, location?: string, serialNumber?: string): Promise<{
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
    }>;
    findAll(skip?: number, take?: number, filters?: {
        category?: string;
        status?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
    }): Promise<{
        items: ({
            seller: {
                id: string;
                username: string;
                nickname: string;
                reputation: number;
            };
        } & {
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        seller: {
            id: string;
            username: string;
            nickname: string;
            reputation: number;
        };
    } & {
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
    }>;
    findBySellerId(sellerId: string, skip?: number, take?: number): Promise<{
        items: {
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
        }[];
        total: number;
    }>;
    approve(itemId: string, adminId: string): Promise<{
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
    }>;
    reject(itemId: string, reason: string, adminId: string): Promise<{
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
    }>;
    markAsSold(itemId: string): Promise<{
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
    }>;
    remove(itemId: string, userId: string, userRole: string): Promise<{
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
    }>;
}

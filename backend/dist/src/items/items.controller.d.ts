import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { RejectItemDto } from './dto/reject-item.dto';
export declare class ItemsController {
    private itemsService;
    constructor(itemsService: ItemsService);
    findAll(skip?: number, take?: number, status?: string, category?: string, search?: string, minPrice?: number, maxPrice?: number): Promise<{
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
    create(req: any, body: CreateItemDto): Promise<{
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
    findMyItems(req: any): Promise<{
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
    approve(id: string, req: any): Promise<{
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
    reject(id: string, body: RejectItemDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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

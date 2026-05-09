import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsController {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        emailNotify: boolean;
        smsNotify: boolean;
        notifyEvents: string[];
    }>;
    updateSettings(req: any, body: {
        emailNotify?: boolean;
        smsNotify?: boolean;
        notifyEvents?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        emailNotify: boolean;
        smsNotify: boolean;
        notifyEvents: string[];
    }>;
}

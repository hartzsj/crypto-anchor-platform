import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
export declare enum NotificationType {
    ORDER_CREATED = "order_created",
    ORDER_PAID = "order_paid",
    ORDER_SHIPPED = "order_shipped",
    ORDER_COMPLETED = "order_completed",
    ORDER_CANCELED = "order_canceled",
    DEPOSIT_RECEIVED = "deposit_received",
    DISPUTE_OPENED = "dispute_opened",
    DISPUTE_RESOLVED = "dispute_resolved",
    ITEM_APPROVED = "item_approved",
    ITEM_REJECTED = "item_rejected"
}
interface NotificationData {
    orderId?: string;
    itemTitle?: string;
    amount?: number;
    trackingNumber?: string;
    logisticsCompany?: string;
    reason?: string;
    refund?: boolean;
}
export declare class NotificationsService {
    private configService;
    private prisma;
    private emailService;
    private smsService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, emailService: EmailService, smsService: SmsService);
    sendNotification(userId: string, type: NotificationType, data: NotificationData): Promise<void>;
    private sendEmailNotification;
    private sendSmsNotification;
    private getEmailContent;
    sendBulkNotifications(userIds: string[], type: NotificationType, data: NotificationData): Promise<void>;
}
export {};

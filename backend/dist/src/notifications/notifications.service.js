"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = exports.NotificationType = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_CREATED"] = "order_created";
    NotificationType["ORDER_PAID"] = "order_paid";
    NotificationType["ORDER_SHIPPED"] = "order_shipped";
    NotificationType["ORDER_COMPLETED"] = "order_completed";
    NotificationType["ORDER_CANCELED"] = "order_canceled";
    NotificationType["DEPOSIT_RECEIVED"] = "deposit_received";
    NotificationType["DISPUTE_OPENED"] = "dispute_opened";
    NotificationType["DISPUTE_RESOLVED"] = "dispute_resolved";
    NotificationType["ITEM_APPROVED"] = "item_approved";
    NotificationType["ITEM_REJECTED"] = "item_rejected";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    configService;
    prisma;
    emailService;
    smsService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(configService, prisma, emailService, smsService) {
        this.configService = configService;
        this.prisma = prisma;
        this.emailService = emailService;
        this.smsService = smsService;
    }
    async sendNotification(userId, type, data) {
        const settings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });
        if (!settings) {
            await this.sendEmailNotification(userId, type, data);
            return;
        }
        if (!settings.notifyEvents.includes(type)) {
            this.logger.debug(`用户 ${userId} 未启用 ${type} 通知`);
            return;
        }
        if (settings.emailNotify) {
            await this.sendEmailNotification(userId, type, data);
        }
        if (settings.smsNotify) {
            await this.sendSmsNotification(userId, type, data);
        }
    }
    async sendEmailNotification(userId, type, data) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user || !user.email) {
                this.logger.warn(`用户 ${userId} 没有邮箱地址`);
                return;
            }
            const { subject, content } = this.getEmailContent(type, data, user.nickname);
            await this.emailService.sendEmail(user.email, subject, content);
            this.logger.log(`邮件通知已发送给用户 ${userId}: ${type}`);
        }
        catch (error) {
            this.logger.error(`发送邮件通知失败:`, error);
        }
    }
    async sendSmsNotification(userId, type, data) {
        try {
            this.logger.debug(`短信通知功能待实现: ${type}`);
        }
        catch (error) {
            this.logger.error(`发送短信通知失败:`, error);
        }
    }
    getEmailContent(type, data, nickname) {
        const siteName = this.configService.get('SITE_NAME', 'CryptoAnchor');
        switch (type) {
            case NotificationType.ORDER_CREATED:
                return {
                    subject: `[${siteName}] 新订单创建`,
                    content: `
亲爱的 ${nickname}，

您的订单已创建成功！

订单信息：
- 物品：${data.itemTitle || '未知'}
- 订单ID：${data.orderId || '未知'}

请尽快完成支付，卖家将在您支付后发货。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ORDER_PAID:
                return {
                    subject: `[${siteName}] 订单已支付`,
                    content: `
亲爱的 ${nickname}，

您的订单已支付成功！

订单信息：
- 物品：${data.itemTitle || '未知'}
- 订单ID：${data.orderId || '未知'}
- 金额：${data.amount || 0} USDT

资金已托管，等待卖家发货。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ORDER_SHIPPED:
                return {
                    subject: `[${siteName}] 订单已发货`,
                    content: `
亲爱的 ${nickname}，

您的订单已发货！

物流信息：
- 物流公司：${data.logisticsCompany || '未知'}
- 物流单号：${data.trackingNumber || '未知'}

请在收到货物后确认收货。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ORDER_COMPLETED:
                return {
                    subject: `[${siteName}] 订单已完成`,
                    content: `
亲爱的 ${nickname}，

您的订单已完成！

订单信息：
- 物品：${data.itemTitle || '未知'}
- 订单ID：${data.orderId || '未知'}

感谢您的交易，欢迎留下评价！

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ORDER_CANCELED:
                return {
                    subject: `[${siteName}] 订单已取消`,
                    content: `
亲爱的 ${nickname}，

您的订单已取消。

订单信息：
- 物品：${data.itemTitle || '未知'}
- 订单ID：${data.orderId || '未知'}

如有已支付的资金，将自动退还到您的钱包。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.DEPOSIT_RECEIVED:
                return {
                    subject: `[${siteName}] 充值成功`,
                    content: `
亲爱的 ${nickname}，

您的充值已成功入账！

充值金额：${data.amount || 0} USDT

请在钱包页面查看详情。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.DISPUTE_OPENED:
                return {
                    subject: `[${siteName}] 订单争议已开启`,
                    content: `
亲爱的 ${nickname}，

您的订单争议已开启。

订单信息：
- 订单ID：${data.orderId || '未知'}
- 争议原因：${data.reason || '未知'}

管理员将尽快介入处理。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.DISPUTE_RESOLVED:
                return {
                    subject: `[${siteName}] 订单争议已解决`,
                    content: `
亲爱的 ${nickname}，

您的订单争议已解决。

订单信息：
- 订单ID：${data.orderId || '未知'}
- 处理结果：${data.refund ? '退款给买家' : '放款给卖家'}

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ITEM_APPROVED:
                return {
                    subject: `[${siteName}] 物品已审核通过`,
                    content: `
亲爱的 ${nickname}，

您发布的物品已审核通过！

物品：${data.itemTitle || '未知'}

现在可以在市场上展示和交易。

${siteName} 团队
          `.trim(),
                };
            case NotificationType.ITEM_REJECTED:
                return {
                    subject: `[${siteName}] 物品审核未通过`,
                    content: `
亲爱的 ${nickname}，

您发布的物品审核未通过。

物品：${data.itemTitle || '未知'}
拒绝原因：${data.reason || '未知'}

请修改后重新提交。

${siteName} 团队
          `.trim(),
                };
            default:
                return {
                    subject: `[${siteName}] 系统通知`,
                    content: `亲爱的 ${nickname}，您有新的系统通知。`,
                };
        }
    }
    async sendBulkNotifications(userIds, type, data) {
        for (const userId of userIds) {
            await this.sendNotification(userId, type, data);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        email_service_1.EmailService,
        sms_service_1.SmsService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
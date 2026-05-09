import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_PAID = 'order_paid',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELED = 'order_canceled',
  DEPOSIT_RECEIVED = 'deposit_received',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  ITEM_APPROVED = 'item_approved',
  ITEM_REJECTED = 'item_rejected',
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  /**
   * 发送通知给用户
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: NotificationData,
  ) {
    // 获取用户设置
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // 默认只发邮件
      await this.sendEmailNotification(userId, type, data);
      return;
    }

    // 检查用户是否启用了此类型的通知
    if (!settings.notifyEvents.includes(type)) {
      this.logger.debug(`用户 ${userId} 未启用 ${type} 通知`);
      return;
    }

    // 发送邮件通知
    if (settings.emailNotify) {
      await this.sendEmailNotification(userId, type, data);
    }

    // 发送短信通知
    if (settings.smsNotify) {
      await this.sendSmsNotification(userId, type, data);
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(
    userId: string,
    type: NotificationType,
    data: NotificationData,
  ) {
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
    } catch (error) {
      this.logger.error(`发送邮件通知失败:`, error);
    }
  }

  /**
   * 发送短信通知
   */
  private async sendSmsNotification(
    userId: string,
    type: NotificationType,
    data: NotificationData,
  ) {
    try {
      // 获取用户手机号（需要扩展 User 模型）
      // 目前暂不实现，保留接口
      this.logger.debug(`短信通知功能待实现: ${type}`);
    } catch (error) {
      this.logger.error(`发送短信通知失败:`, error);
    }
  }

  /**
   * 获取邮件内容
   */
  private getEmailContent(
    type: NotificationType,
    data: NotificationData,
    nickname: string,
  ): { subject: string; content: string } {
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

  /**
   * 批量发送通知给多个用户
   */
  async sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    data: NotificationData,
  ) {
    for (const userId of userIds) {
      await this.sendNotification(userId, type, data);
    }
  }
}
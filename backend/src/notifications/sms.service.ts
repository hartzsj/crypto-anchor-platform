import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    this.accountSid = this.configService.get('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.configService.get('TWILIO_AUTH_TOKEN', '');
    this.fromNumber = this.configService.get('TWILIO_FROM_NUMBER', '');
  }

  /**
   * 发送短信
   * 使用 Twilio API
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken) {
      this.logger.warn('Twilio credentials not configured, skipping SMS');
      this.logger.debug(`Would send SMS to ${to}: ${message}`);
      return false;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', this.fromNumber);
      formData.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        this.logger.log(`SMS sent successfully, SID: ${data.sid}`);
        return true;
      } else {
        const error = await response.text();
        this.logger.error(`Twilio API error: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  /**
   * 发送验证码短信
   */
  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    const message = `您的 CryptoAnchor 验证码是: ${code}，有效期5分钟。`;
    return this.sendSms(to, message);
  }

  /**
   * 发送订单状态通知
   */
  async sendOrderNotification(to: string, type: string, orderId: string): Promise<boolean> {
    const messages: Record<string, string> = {
      created: `【CryptoAnchor】订单已创建，订单号: ${orderId}`,
      paid: `【CryptoAnchor】订单已支付，订单号: ${orderId}`,
      shipped: `【CryptoAnchor】订单已发货，订单号: ${orderId}`,
      completed: `【CryptoAnchor】订单已完成，订单号: ${orderId}`,
      canceled: `【CryptoAnchor】订单已取消，订单号: ${orderId}`,
    };

    const message = messages[type] || `【CryptoAnchor】订单状态更新，订单号: ${orderId}`;
    return this.sendSms(to, message);
  }
}
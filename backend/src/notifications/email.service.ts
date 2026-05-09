import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('SENDGRID_API_KEY', '');
    this.fromEmail = this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cryptoanchor.com');
  }

  /**
   * 发送邮件
   * 使用 SendGrid API
   */
  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('SendGrid API key not configured, skipping email');
      this.logger.debug(`Would send email to ${to}: ${subject}`);
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: { email: this.fromEmail },
          content: [
            {
              type: 'text/plain',
              value: content,
            },
          ],
        }),
      });

      if (response.ok) {
        this.logger.log(`Email sent successfully to ${to}`);
        return true;
      } else {
        const error = await response.text();
        this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * 发送 HTML 邮件
   */
  async sendHtmlEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('SendGrid API key not configured, skipping email');
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: { email: this.fromEmail },
          content: [
            {
              type: 'text/html',
              value: htmlContent,
            },
          ],
        }),
      });

      if (response.ok) {
        this.logger.log(`HTML email sent successfully to ${to}`);
        return true;
      } else {
        const error = await response.text();
        this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to send HTML email:', error);
      return false;
    }
  }

  /**
   * 发送模板邮件
   */
  async sendTemplateEmail(
    to: string,
    templateId: string,
    dynamicData: Record<string, any>,
  ): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('SendGrid API key not configured, skipping template email');
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              dynamic_template_data: dynamicData,
            },
          ],
          from: { email: this.fromEmail },
          template_id: templateId,
        }),
      });

      if (response.ok) {
        this.logger.log(`Template email sent successfully to ${to}`);
        return true;
      } else {
        const error = await response.text();
        this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to send template email:', error);
      return false;
    }
  }
}
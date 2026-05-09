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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    apiKey;
    fromEmail;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('SENDGRID_API_KEY', '');
        this.fromEmail = this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cryptoanchor.com');
    }
    async sendEmail(to, subject, content) {
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
            }
            else {
                const error = await response.text();
                this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to send email:', error);
            return false;
        }
    }
    async sendHtmlEmail(to, subject, htmlContent) {
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
            }
            else {
                const error = await response.text();
                this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to send HTML email:', error);
            return false;
        }
    }
    async sendTemplateEmail(to, templateId, dynamicData) {
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
            }
            else {
                const error = await response.text();
                this.logger.error(`SendGrid API error: ${response.status} - ${error}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to send template email:', error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map
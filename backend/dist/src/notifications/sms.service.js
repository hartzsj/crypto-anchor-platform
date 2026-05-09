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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsService = SmsService_1 = class SmsService {
    configService;
    logger = new common_1.Logger(SmsService_1.name);
    accountSid;
    authToken;
    fromNumber;
    constructor(configService) {
        this.configService = configService;
        this.accountSid = this.configService.get('TWILIO_ACCOUNT_SID', '');
        this.authToken = this.configService.get('TWILIO_AUTH_TOKEN', '');
        this.fromNumber = this.configService.get('TWILIO_FROM_NUMBER', '');
    }
    async sendSms(to, message) {
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
            }
            else {
                const error = await response.text();
                this.logger.error(`Twilio API error: ${response.status} - ${error}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to send SMS:', error);
            return false;
        }
    }
    async sendVerificationCode(to, code) {
        const message = `您的 CryptoAnchor 验证码是: ${code}，有效期5分钟。`;
        return this.sendSms(to, message);
    }
    async sendOrderNotification(to, type, orderId) {
        const messages = {
            created: `【CryptoAnchor】订单已创建，订单号: ${orderId}`,
            paid: `【CryptoAnchor】订单已支付，订单号: ${orderId}`,
            shipped: `【CryptoAnchor】订单已发货，订单号: ${orderId}`,
            completed: `【CryptoAnchor】订单已完成，订单号: ${orderId}`,
            canceled: `【CryptoAnchor】订单已取消，订单号: ${orderId}`,
        };
        const message = messages[type] || `【CryptoAnchor】订单状态更新，订单号: ${orderId}`;
        return this.sendSms(to, message);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map
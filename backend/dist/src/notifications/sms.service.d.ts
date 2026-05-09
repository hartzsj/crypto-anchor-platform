import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private readonly logger;
    private readonly accountSid;
    private readonly authToken;
    private readonly fromNumber;
    constructor(configService: ConfigService);
    sendSms(to: string, message: string): Promise<boolean>;
    sendVerificationCode(to: string, code: string): Promise<boolean>;
    sendOrderNotification(to: string, type: string, orderId: string): Promise<boolean>;
}

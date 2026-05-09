import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, content: string): Promise<boolean>;
    sendHtmlEmail(to: string, subject: string, htmlContent: string): Promise<boolean>;
    sendTemplateEmail(to: string, templateId: string, dynamicData: Record<string, any>): Promise<boolean>;
}

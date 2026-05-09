import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class TronAddressService {
    private configService;
    private readonly logger;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    getDepositAddress(userId: string): Promise<string | null>;
    setDepositAddress(userId: string, address: string): Promise<void>;
    private isValidTronAddress;
}

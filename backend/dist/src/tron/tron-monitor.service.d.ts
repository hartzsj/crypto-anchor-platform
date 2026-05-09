import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
export declare class TronMonitorService {
    private configService;
    private prisma;
    private walletsService;
    private readonly logger;
    private readonly apiKey;
    constructor(configService: ConfigService, prisma: PrismaService, walletsService: WalletsService);
    scanDeposits(): Promise<void>;
    private isValidTronAddress;
    private checkAddressDeposit;
    private processDeposit;
    getAddressBalance(address: string): Promise<number>;
}

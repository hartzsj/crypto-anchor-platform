import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
export declare class DepositMonitorService {
    private configService;
    private prisma;
    private walletsService;
    private readonly logger;
    private readonly tronApiKey;
    private readonly bscRpcUrl;
    constructor(configService: ConfigService, prisma: PrismaService, walletsService: WalletsService);
    scanAllDeposits(): Promise<void>;
    private scanTronDeposits;
    private checkTronDeposit;
    private scanBscDeposits;
    private checkBscDeposit;
    private processDeposit;
    private isValidTronAddress;
    private isValidBscAddress;
    getAddressBalance(address: string, networkName: string, tokenSymbol: string): Promise<number>;
    private getTronBalance;
    private getBscBalance;
}

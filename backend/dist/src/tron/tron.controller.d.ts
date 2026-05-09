import { TronAddressService } from './tron-address.service';
import { TronMonitorService } from './tron-monitor.service';
import { PrismaService } from '../prisma/prisma.service';
import { SetDepositAddressDto } from './dto/set-deposit-address.dto';
export declare class TronController {
    private tronAddressService;
    private tronMonitorService;
    private prisma;
    constructor(tronAddressService: TronAddressService, tronMonitorService: TronMonitorService, prisma: PrismaService);
    getDepositAddress(req: any): Promise<{
        address: string;
    }>;
    setDepositAddress(req: any, body: SetDepositAddressDto): Promise<{
        success: boolean;
        address: string;
    }>;
    getDepositBalance(req: any): Promise<{
        balance: number;
        address: null;
    } | {
        balance: number;
        address: string;
    }>;
}

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
var TronAddressService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronAddressService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let TronAddressService = TronAddressService_1 = class TronAddressService {
    configService;
    logger = new common_1.Logger(TronAddressService_1.name);
    prisma;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async getDepositAddress(userId) {
        const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
            where: { name: 'TRON', isActive: true },
        });
        if (!tronNetwork) {
            this.logger.error('TRON network not found');
            return null;
        }
        const walletAddress = await this.prisma.walletAddress.findUnique({
            where: {
                userId_networkId: {
                    userId,
                    networkId: tronNetwork.id,
                },
            },
        });
        return walletAddress?.address || null;
    }
    async setDepositAddress(userId, address) {
        if (!this.isValidTronAddress(address)) {
            throw new Error('无效的TRON地址格式');
        }
        const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
            where: { name: 'TRON', isActive: true },
        });
        if (!tronNetwork) {
            throw new Error('TRON network not found');
        }
        const existing = await this.prisma.walletAddress.findFirst({
            where: { address },
        });
        if (existing && existing.userId !== userId) {
            throw new Error('该地址已被其他用户使用');
        }
        await this.prisma.walletAddress.upsert({
            where: {
                userId_networkId: {
                    userId,
                    networkId: tronNetwork.id,
                },
            },
            create: {
                userId,
                networkId: tronNetwork.id,
                address,
            },
            update: {
                address,
            },
        });
        this.logger.log(`用户 ${userId} 设置TRON充值地址: ${address}`);
    }
    isValidTronAddress(address) {
        return /^T[A-Za-z1-9]{33}$/.test(address);
    }
};
exports.TronAddressService = TronAddressService;
exports.TronAddressService = TronAddressService = TronAddressService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], TronAddressService);
//# sourceMappingURL=tron-address.service.js.map
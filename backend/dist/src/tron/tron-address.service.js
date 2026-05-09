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
    async generateDepositAddress(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (wallet?.depositAddress) {
            return wallet.depositAddress;
        }
        const depositAddress = await this.createOrGetAddress(userId);
        await this.prisma.wallet.update({
            where: { userId },
            data: { depositAddress },
        });
        this.logger.log(`用户 ${userId} 充值地址: ${depositAddress}`);
        return depositAddress;
    }
    async createOrGetAddress(userId) {
        return `TUser${userId.slice(0, 8)}DepositAddressPending`;
    }
    async setDepositAddress(userId, address) {
        if (!this.isValidTronAddress(address)) {
            throw new Error('无效的TRON地址格式');
        }
        const existing = await this.prisma.wallet.findFirst({
            where: { depositAddress: address },
        });
        if (existing && existing.userId !== userId) {
            throw new Error('该地址已被其他用户使用');
        }
        await this.prisma.wallet.update({
            where: { userId },
            data: { depositAddress: address },
        });
        this.logger.log(`用户 ${userId} 设置充值地址: ${address}`);
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
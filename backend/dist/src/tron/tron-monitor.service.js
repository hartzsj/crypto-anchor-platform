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
var TronMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronMonitorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRONGRID_API = 'https://api.trongrid.io';
let TronMonitorService = TronMonitorService_1 = class TronMonitorService {
    configService;
    prisma;
    walletsService;
    logger = new common_1.Logger(TronMonitorService_1.name);
    apiKey;
    constructor(configService, prisma, walletsService) {
        this.configService = configService;
        this.prisma = prisma;
        this.walletsService = walletsService;
        this.apiKey = this.configService.get('TRONGRID_API_KEY') || '';
    }
    async scanDeposits() {
        this.logger.log('开始扫描USDT充值...');
        try {
            const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
                where: { name: 'TRON', isActive: true },
            });
            if (!tronNetwork) {
                this.logger.warn('TRON network not found');
                return;
            }
            const walletAddresses = await this.prisma.walletAddress.findMany({
                where: { networkId: tronNetwork.id },
                include: { user: true },
            });
            for (const wa of walletAddresses) {
                if (!this.isValidTronAddress(wa.address)) {
                    this.logger.debug(`跳过无效地址: ${wa.address}`);
                    continue;
                }
                try {
                    await this.checkAddressDeposit(wa.userId, wa.address);
                }
                catch (error) {
                    this.logger.error(`扫描地址 ${wa.address} 失败:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error('扫描充值失败:', error);
        }
    }
    isValidTronAddress(address) {
        return /^T[A-Za-z1-9]{33}$/.test(address);
    }
    async checkAddressDeposit(userId, address) {
        const url = `${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${USDT_CONTRACT_ADDRESS}`;
        const response = await fetch(url, {
            headers: {
                'TRON-PRO-API-KEY': this.apiKey,
            },
        });
        if (!response.ok) {
            throw new Error(`TronGrid API错误: ${response.status}`);
        }
        const data = await response.json();
        const transactions = data.data || [];
        for (const tx of transactions) {
            if (tx.to !== address)
                continue;
            const existingTx = await this.prisma.transaction.findFirst({
                where: { txHash: tx.transaction_id },
            });
            if (existingTx)
                continue;
            const amount = parseFloat(tx.value) / 1e6;
            if (amount <= 0)
                continue;
            await this.processDeposit(userId, amount, tx.transaction_id);
        }
    }
    async processDeposit(userId, amount, txHash) {
        this.logger.log(`用户 ${userId} 充值 ${amount} USDT, tx: ${txHash}`);
        try {
            await this.walletsService.deposit(userId, amount, 'TRON', 'USDT', txHash);
            this.logger.log(`✅ 用户 ${userId} 充值成功: ${amount} USDT`);
        }
        catch (error) {
            this.logger.error(`充值入账失败:`, error);
        }
    }
    async getAddressBalance(address) {
        if (!this.isValidTronAddress(address)) {
            return 0;
        }
        try {
            const url = `${TRONGRID_API}/v1/accounts/${address}`;
            const response = await fetch(url, {
                headers: {
                    'TRON-PRO-API-KEY': this.apiKey,
                },
            });
            if (!response.ok) {
                this.logger.warn(`获取余额失败: ${response.status}`);
                return 0;
            }
            const data = await response.json();
            const trc20Balances = data.data?.[0]?.trc20_balance || [];
            const usdtBalance = trc20Balances.find((b) => b.token_id === USDT_CONTRACT_ADDRESS);
            if (!usdtBalance)
                return 0;
            return parseFloat(usdtBalance.balance) / 1e6;
        }
        catch (error) {
            this.logger.error(`获取地址余额错误: ${address}`, error);
            return 0;
        }
    }
};
exports.TronMonitorService = TronMonitorService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TronMonitorService.prototype, "scanDeposits", null);
exports.TronMonitorService = TronMonitorService = TronMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        wallets_service_1.WalletsService])
], TronMonitorService);
//# sourceMappingURL=tron-monitor.service.js.map
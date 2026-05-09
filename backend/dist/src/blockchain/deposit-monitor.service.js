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
var DepositMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositMonitorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
let DepositMonitorService = DepositMonitorService_1 = class DepositMonitorService {
    configService;
    prisma;
    walletsService;
    logger = new common_1.Logger(DepositMonitorService_1.name);
    tronApiKey;
    bscRpcUrl;
    constructor(configService, prisma, walletsService) {
        this.configService = configService;
        this.prisma = prisma;
        this.walletsService = walletsService;
        this.tronApiKey = this.configService.get('TRONGRID_API_KEY') || '';
        this.bscRpcUrl = this.configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org');
    }
    async scanAllDeposits() {
        this.logger.log('开始扫描多链充值...');
        const networks = await this.prisma.blockchainNetwork.findMany({
            where: { isActive: true },
            include: { tokens: { where: { isActive: true } } },
        });
        for (const network of networks) {
            try {
                if (network.name === 'TRON') {
                    await this.scanTronDeposits(network);
                }
                else if (network.name === 'BSC') {
                    await this.scanBscDeposits(network);
                }
            }
            catch (error) {
                this.logger.error(`扫描 ${network.name} 充值失败:`, error);
            }
        }
    }
    async scanTronDeposits(network) {
        const usdtToken = network.tokens.find((t) => t.symbol === 'USDT');
        if (!usdtToken)
            return;
        const walletAddresses = await this.prisma.walletAddress.findMany({
            where: { networkId: network.id },
            include: { user: { include: { wallet: true } } },
        });
        for (const wa of walletAddresses) {
            if (!this.isValidTronAddress(wa.address))
                continue;
            try {
                await this.checkTronDeposit(wa, usdtToken);
            }
            catch (error) {
                this.logger.error(`扫描TRON地址 ${wa.address} 失败:`, error);
            }
        }
    }
    async checkTronDeposit(walletAddress, token) {
        const address = walletAddress.address;
        const userId = walletAddress.userId;
        const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${token.contractAddress}`;
        const response = await fetch(url, {
            headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
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
            const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
            if (amount <= 0)
                continue;
            await this.processDeposit(userId, amount, 'TRON', 'USDT', tx.transaction_id);
        }
    }
    async scanBscDeposits(network) {
        const walletAddresses = await this.prisma.walletAddress.findMany({
            where: { networkId: network.id },
            include: { user: { include: { wallet: true } } },
        });
        for (const wa of walletAddresses) {
            if (!this.isValidBscAddress(wa.address))
                continue;
            for (const token of network.tokens) {
                try {
                    await this.checkBscDeposit(wa, token, network);
                }
                catch (error) {
                    this.logger.error(`扫描BSC地址 ${wa.address} ${token.symbol} 失败:`, error);
                }
            }
        }
    }
    async checkBscDeposit(walletAddress, token, network) {
        const address = walletAddress.address;
        const userId = walletAddress.userId;
        const bscApiKey = this.configService.get('BSCSCAN_API_KEY') || '';
        if (token.isNative) {
            const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&page=1&offset=20&sort=desc&apikey=${bscApiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === '1' && data.result) {
                for (const tx of data.result) {
                    if (tx.to.toLowerCase() !== address.toLowerCase())
                        continue;
                    if (tx.value === '0')
                        continue;
                    const existingTx = await this.prisma.transaction.findFirst({
                        where: { txHash: tx.hash },
                    });
                    if (existingTx)
                        continue;
                    const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
                    if (amount <= 0)
                        continue;
                    await this.processDeposit(userId, amount, 'BSC', token.symbol, tx.hash);
                }
            }
        }
        else {
            const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${token.contractAddress}&address=${address}&page=1&offset=20&sort=desc&apikey=${bscApiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === '1' && data.result) {
                for (const tx of data.result) {
                    if (tx.to.toLowerCase() !== address.toLowerCase())
                        continue;
                    const existingTx = await this.prisma.transaction.findFirst({
                        where: { txHash: tx.hash },
                    });
                    if (existingTx)
                        continue;
                    const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
                    if (amount <= 0)
                        continue;
                    await this.processDeposit(userId, amount, 'BSC', token.symbol, tx.hash);
                }
            }
        }
    }
    async processDeposit(userId, amount, networkName, tokenSymbol, txHash) {
        this.logger.log(`用户 ${userId} 充值 ${amount} ${tokenSymbol} on ${networkName}, tx: ${txHash}`);
        try {
            await this.walletsService.deposit(userId, amount, networkName, tokenSymbol, txHash);
            this.logger.log(`✅ 用户 ${userId} 充值成功: ${amount} ${tokenSymbol}`);
        }
        catch (error) {
            this.logger.error(`充值入账失败:`, error);
        }
    }
    isValidTronAddress(address) {
        return /^T[A-Za-z1-9]{33}$/.test(address);
    }
    isValidBscAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    async getAddressBalance(address, networkName, tokenSymbol) {
        if (networkName === 'TRON') {
            return this.getTronBalance(address, tokenSymbol);
        }
        else if (networkName === 'BSC') {
            return this.getBscBalance(address, tokenSymbol);
        }
        return 0;
    }
    async getTronBalance(address, tokenSymbol) {
        if (!this.isValidTronAddress(address))
            return 0;
        const token = await this.prisma.token.findFirst({
            where: {
                network: { name: 'TRON' },
                symbol: tokenSymbol,
            },
        });
        if (!token)
            return 0;
        try {
            if (token.isNative) {
                const url = `https://api.trongrid.io/v1/accounts/${address}`;
                const response = await fetch(url, {
                    headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
                });
                const data = await response.json();
                const balance = data.data?.[0]?.balance || 0;
                return parseFloat(balance) / Math.pow(10, token.decimals);
            }
            else {
                const url = `https://api.trongrid.io/v1/accounts/${address}`;
                const response = await fetch(url, {
                    headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
                });
                const data = await response.json();
                const trc20Balances = data.data?.[0]?.trc20_balance || [];
                const tokenBalance = trc20Balances.find((b) => b.token_id === token.contractAddress);
                if (!tokenBalance)
                    return 0;
                return parseFloat(tokenBalance.balance) / Math.pow(10, token.decimals);
            }
        }
        catch (error) {
            this.logger.error(`获取TRON余额错误:`, error);
            return 0;
        }
    }
    async getBscBalance(address, tokenSymbol) {
        if (!this.isValidBscAddress(address))
            return 0;
        const token = await this.prisma.token.findFirst({
            where: {
                network: { name: 'BSC' },
                symbol: tokenSymbol,
            },
        });
        if (!token)
            return 0;
        const bscApiKey = this.configService.get('BSCSCAN_API_KEY') || '';
        try {
            if (token.isNative) {
                const url = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${bscApiKey}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.status === '1') {
                    return parseFloat(data.result) / Math.pow(10, token.decimals);
                }
            }
            else {
                const url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${token.contractAddress}&address=${address}&tag=latest&apikey=${bscApiKey}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.status === '1') {
                    return parseFloat(data.result) / Math.pow(10, token.decimals);
                }
            }
        }
        catch (error) {
            this.logger.error(`获取BSC余额错误:`, error);
        }
        return 0;
    }
};
exports.DepositMonitorService = DepositMonitorService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DepositMonitorService.prototype, "scanAllDeposits", null);
exports.DepositMonitorService = DepositMonitorService = DepositMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        wallets_service_1.WalletsService])
], DepositMonitorService);
//# sourceMappingURL=deposit-monitor.service.js.map
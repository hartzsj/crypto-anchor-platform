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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletsService = class WalletsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateWallet(userId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: {
                    userId,
                    balance: 0,
                    frozenBalance: 0,
                },
            });
        }
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        return {
            balance: Number(wallet.balance),
            frozenBalance: Number(wallet.frozenBalance),
            total: Number(wallet.balance) + Number(wallet.frozenBalance),
        };
    }
    async deposit(userId, amount, description) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('充值金额必须大于0');
        }
        const wallet = await this.getOrCreateWallet(userId);
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore + amount;
        return this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: balanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    description: description || '充值',
                },
            });
            return updatedWallet;
        });
    }
    async withdraw(userId, amount, address) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('提现金额必须大于0');
        }
        const wallet = await this.getOrCreateWallet(userId);
        if (Number(wallet.balance) < amount) {
            throw new common_1.BadRequestException('余额不足');
        }
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore - amount;
        return this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: balanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAW',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    description: `提现到地址: ${address}`,
                },
            });
            return updatedWallet;
        });
    }
    async freezeFunds(userId, amount) {
        const wallet = await this.getOrCreateWallet(userId);
        if (Number(wallet.balance) < amount) {
            throw new common_1.BadRequestException('余额不足');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId },
                data: {
                    balance: { decrement: amount },
                    frozenBalance: { increment: amount },
                },
            });
        });
    }
    async releaseFunds(userId, amount) {
        const wallet = await this.getOrCreateWallet(userId);
        return this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId },
                data: {
                    frozenBalance: { decrement: amount },
                    balance: { increment: amount },
                },
            });
        });
    }
    async transferToSeller(buyerId, sellerId, amount, orderId) {
        const buyerWallet = await this.getOrCreateWallet(buyerId);
        const sellerWallet = await this.getOrCreateWallet(sellerId);
        if (Number(buyerWallet.frozenBalance) < amount) {
            throw new common_1.BadRequestException('冻结资金不足');
        }
        const sellerBalanceBefore = Number(sellerWallet.balance);
        const sellerBalanceAfter = sellerBalanceBefore + amount;
        return this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId: buyerId },
                data: {
                    frozenBalance: { decrement: amount },
                },
            });
            const updatedSellerWallet = await tx.wallet.update({
                where: { userId: sellerId },
                data: {
                    balance: sellerBalanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: sellerWallet.id,
                    type: 'ORDER_RELEASE',
                    amount: amount,
                    balanceBefore: sellerBalanceBefore,
                    balanceAfter: sellerBalanceAfter,
                    orderId,
                    description: '订单完成，资金释放',
                },
            });
            return updatedSellerWallet;
        });
    }
    async refund(userId, amount, orderId) {
        const wallet = await this.getOrCreateWallet(userId);
        if (Number(wallet.frozenBalance) < amount) {
            throw new common_1.BadRequestException('冻结资金不足');
        }
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore + amount;
        return this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    frozenBalance: { decrement: amount },
                    balance: balanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'ORDER_REFUND',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    orderId,
                    description: '订单取消，资金退回',
                },
            });
            return updatedWallet;
        });
    }
    async getTransactions(userId, skip = 0, take = 20) {
        const wallet = await this.getOrCreateWallet(userId);
        return this.prisma.transaction.findMany({
            where: { walletId: wallet.id },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map
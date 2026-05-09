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
            include: {
                balances: {
                    include: {
                        token: {
                            include: { network: true },
                        },
                    },
                },
            },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId },
                include: {
                    balances: {
                        include: {
                            token: {
                                include: { network: true },
                            },
                        },
                    },
                },
            });
        }
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        const networks = await this.prisma.blockchainNetwork.findMany({
            where: { isActive: true },
            include: { tokens: { where: { isActive: true } } },
        });
        for (const network of networks) {
            for (const token of network.tokens) {
                const existingBalance = wallet.balances.find((b) => b.tokenId === token.id);
                if (!existingBalance) {
                    await this.prisma.walletBalance.create({
                        data: {
                            walletId: wallet.id,
                            tokenId: token.id,
                            balance: 0,
                            frozenBalance: 0,
                        },
                    });
                }
            }
        }
        const updatedWallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                balances: {
                    include: {
                        token: {
                            include: { network: true },
                        },
                    },
                },
            },
        });
        return {
            balances: updatedWallet.balances.map((b) => ({
                id: b.id,
                symbol: b.token.symbol,
                network: b.token.network.name,
                balance: Number(b.balance),
                frozenBalance: Number(b.frozenBalance),
                decimals: b.token.decimals,
            })),
        };
    }
    async getTokenBalance(userId, networkName, tokenSymbol) {
        const wallet = await this.getOrCreateWallet(userId);
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName, isActive: true },
        });
        if (!network) {
            throw new common_1.BadRequestException(`网络 ${networkName} 不存在或未激活`);
        }
        const token = await this.prisma.token.findFirst({
            where: {
                networkId: network.id,
                symbol: tokenSymbol,
                isActive: true,
            },
        });
        if (!token) {
            throw new common_1.BadRequestException(`代币 ${tokenSymbol} 在 ${networkName} 上不存在或未激活`);
        }
        let balance = await this.prisma.walletBalance.findUnique({
            where: {
                walletId_tokenId: {
                    walletId: wallet.id,
                    tokenId: token.id,
                },
            },
        });
        if (!balance) {
            balance = await this.prisma.walletBalance.create({
                data: {
                    walletId: wallet.id,
                    tokenId: token.id,
                    balance: 0,
                    frozenBalance: 0,
                },
            });
        }
        return {
            balance: Number(balance.balance),
            frozenBalance: Number(balance.frozenBalance),
        };
    }
    async deposit(userId, amount, networkName, tokenSymbol, txHash, description) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('充值金额必须大于0');
        }
        const wallet = await this.getOrCreateWallet(userId);
        const { balance: balanceBefore } = await this.getTokenBalance(userId, networkName, tokenSymbol);
        const balanceAfter = balanceBefore + amount;
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: wallet.id,
                        tokenId: token.id,
                    },
                },
                data: { balance: balanceAfter },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    tokenId: token.id,
                    type: 'DEPOSIT',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    txHash: txHash,
                    description: description || `${networkName} ${tokenSymbol} 充值`,
                },
            });
            return { balance: balanceAfter };
        });
    }
    async withdraw(userId, amount, address, networkName, tokenSymbol) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('提现金额必须大于0');
        }
        const wallet = await this.getOrCreateWallet(userId);
        const { balance: balanceBefore } = await this.getTokenBalance(userId, networkName, tokenSymbol);
        if (balanceBefore < amount) {
            throw new common_1.BadRequestException('余额不足');
        }
        const balanceAfter = balanceBefore - amount;
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: wallet.id,
                        tokenId: token.id,
                    },
                },
                data: { balance: balanceAfter },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    tokenId: token.id,
                    type: 'WITHDRAW',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    description: `提现到地址: ${address}`,
                },
            });
            return { balance: balanceAfter };
        });
    }
    async freezeFunds(userId, amount, networkName, tokenSymbol) {
        const wallet = await this.getOrCreateWallet(userId);
        const { balance } = await this.getTokenBalance(userId, networkName, tokenSymbol);
        if (balance < amount) {
            throw new common_1.BadRequestException('余额不足');
        }
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: wallet.id,
                        tokenId: token.id,
                    },
                },
                data: {
                    balance: { decrement: amount },
                    frozenBalance: { increment: amount },
                },
            });
        });
    }
    async releaseFunds(userId, amount, networkName, tokenSymbol) {
        const wallet = await this.getOrCreateWallet(userId);
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: wallet.id,
                        tokenId: token.id,
                    },
                },
                data: {
                    frozenBalance: { decrement: amount },
                    balance: { increment: amount },
                },
            });
        });
    }
    async transferToSeller(buyerId, sellerId, amount, orderId, networkName, tokenSymbol) {
        const buyerWallet = await this.getOrCreateWallet(buyerId);
        const sellerWallet = await this.getOrCreateWallet(sellerId);
        const { frozenBalance: buyerFrozen } = await this.getTokenBalance(buyerId, networkName, tokenSymbol);
        const { balance: sellerBalanceBefore } = await this.getTokenBalance(sellerId, networkName, tokenSymbol);
        if (buyerFrozen < amount) {
            throw new common_1.BadRequestException('冻结资金不足');
        }
        const sellerBalanceAfter = sellerBalanceBefore + amount;
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: buyerWallet.id,
                        tokenId: token.id,
                    },
                },
                data: {
                    frozenBalance: { decrement: amount },
                },
            });
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: sellerWallet.id,
                        tokenId: token.id,
                    },
                },
                data: {
                    balance: sellerBalanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: sellerWallet.id,
                    tokenId: token.id,
                    type: 'ORDER_RELEASE',
                    amount: amount,
                    balanceBefore: sellerBalanceBefore,
                    balanceAfter: sellerBalanceAfter,
                    orderId,
                    description: '订单完成，资金释放',
                },
            });
        });
    }
    async refund(userId, amount, orderId, networkName, tokenSymbol) {
        const wallet = await this.getOrCreateWallet(userId);
        const { frozenBalance, balance: balanceBefore } = await this.getTokenBalance(userId, networkName, tokenSymbol);
        if (frozenBalance < amount) {
            throw new common_1.BadRequestException('冻结资金不足');
        }
        const balanceAfter = balanceBefore + amount;
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName },
        });
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol: tokenSymbol },
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.walletBalance.update({
                where: {
                    walletId_tokenId: {
                        walletId: wallet.id,
                        tokenId: token.id,
                    },
                },
                data: {
                    frozenBalance: { decrement: amount },
                    balance: balanceAfter,
                },
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    tokenId: token.id,
                    type: 'ORDER_REFUND',
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    orderId,
                    description: '订单取消，资金退回',
                },
            });
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
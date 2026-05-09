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
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const tron_adapter_1 = require("./tron.adapter");
const bsc_adapter_1 = require("./bsc.adapter");
const blockchain_interface_1 = require("./blockchain.interface");
let BlockchainService = class BlockchainService {
    configService;
    prisma;
    tronAdapter;
    bscAdapter;
    adapters;
    constructor(configService, prisma, tronAdapter, bscAdapter) {
        this.configService = configService;
        this.prisma = prisma;
        this.tronAdapter = tronAdapter;
        this.bscAdapter = bscAdapter;
        this.adapters = new Map();
    }
    async onModuleInit() {
        this.adapters.set(blockchain_interface_1.BlockchainType.TRON, this.tronAdapter);
        this.adapters.set(blockchain_interface_1.BlockchainType.BSC, this.bscAdapter);
        await this.initializeNetworks();
    }
    async initializeNetworks() {
        const existingNetworks = await this.prisma.blockchainNetwork.count();
        if (existingNetworks === 0) {
            await this.prisma.blockchainNetwork.createMany({
                data: [
                    {
                        id: 'tron-main',
                        name: 'TRON',
                        displayName: 'TRON (TRC-20)',
                        chainId: null,
                        rpcUrl: this.configService.get('TRON_RPC_URL', 'https://api.trongrid.io'),
                        isActive: true,
                    },
                    {
                        id: 'bsc-main',
                        name: 'BSC',
                        displayName: 'BSC (BEP-20)',
                        chainId: '56',
                        rpcUrl: this.configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
                        isActive: true,
                    },
                ],
            });
            const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
                where: { name: 'TRON' },
            });
            const bscNetwork = await this.prisma.blockchainNetwork.findFirst({
                where: { name: 'BSC' },
            });
            if (tronNetwork) {
                await this.prisma.token.createMany({
                    data: [
                        {
                            networkId: tronNetwork.id,
                            symbol: 'TRX',
                            name: 'TRON',
                            contractAddress: null,
                            decimals: 6,
                            isNative: true,
                            isActive: true,
                        },
                        {
                            networkId: tronNetwork.id,
                            symbol: 'USDT',
                            name: 'Tether USD',
                            contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                            decimals: 6,
                            isNative: false,
                            isActive: true,
                        },
                    ],
                });
            }
            if (bscNetwork) {
                await this.prisma.token.createMany({
                    data: [
                        {
                            networkId: bscNetwork.id,
                            symbol: 'BNB',
                            name: 'Binance Coin',
                            contractAddress: null,
                            decimals: 18,
                            isNative: true,
                            isActive: true,
                        },
                        {
                            networkId: bscNetwork.id,
                            symbol: 'USDT',
                            name: 'Tether USD',
                            contractAddress: '0x55d398326f99059fF775485246999027B3197955',
                            decimals: 18,
                            isNative: false,
                            isActive: true,
                        },
                        {
                            networkId: bscNetwork.id,
                            symbol: 'ETH',
                            name: 'Ethereum (BEP-20)',
                            contractAddress: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
                            decimals: 18,
                            isNative: false,
                            isActive: true,
                        },
                    ],
                });
            }
        }
    }
    getAdapter(networkType) {
        const adapter = this.adapters.get(networkType);
        if (!adapter) {
            throw new Error(`Blockchain adapter not found for ${networkType}`);
        }
        return adapter;
    }
    async getSupportedNetworks() {
        return this.prisma.blockchainNetwork.findMany({
            where: { isActive: true },
            include: { tokens: { where: { isActive: true } } },
        });
    }
    async getToken(networkName, symbol) {
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName, isActive: true },
        });
        if (!network)
            return null;
        const token = await this.prisma.token.findFirst({
            where: {
                networkId: network.id,
                symbol: symbol,
                isActive: true,
            },
        });
        if (!token)
            return null;
        return {
            symbol: token.symbol,
            name: token.name,
            contractAddress: token.contractAddress || '',
            decimals: token.decimals,
            isNative: token.isNative,
        };
    }
    async createOnchainEscrow(orderId, networkType, buyerAddress, sellerAddress, amount, tokenSymbol) {
        const adapter = this.getAdapter(networkType);
        const token = await this.getToken(networkType, tokenSymbol);
        if (!token) {
            throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
        }
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkType },
            include: { escrowContracts: { where: { isActive: true }, take: 1 } },
        });
        if (!network || network.escrowContracts.length === 0) {
            throw new Error(`No escrow contract configured for ${networkType}`);
        }
        const result = await adapter.createEscrowOrder(orderId, buyerAddress, sellerAddress, amount, token);
        await this.prisma.onchainOrder.create({
            data: {
                orderId,
                networkId: network.id,
                contractId: network.escrowContracts[0].id,
                escrowId: result.escrowId,
                buyerAddress,
                sellerAddress,
                amount,
                tokenId: await this.getTokenIdFromSymbol(networkType, tokenSymbol),
                status: 'CREATED',
            },
        });
        return result;
    }
    async fundOnchainEscrow(orderId, networkType, buyerAddress, amount, tokenSymbol) {
        const adapter = this.getAdapter(networkType);
        const token = await this.getToken(networkType, tokenSymbol);
        if (!token) {
            throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
        }
        const result = await adapter.fundEscrowOrder(orderId, buyerAddress, amount, token);
        await this.prisma.onchainOrder.update({
            where: { orderId },
            data: {
                status: 'FUNDED',
                fundedTxHash: result.txHash,
            },
        });
        return result;
    }
    async releaseOnchainEscrow(orderId, networkType) {
        const adapter = this.getAdapter(networkType);
        const result = await adapter.releaseEscrow(orderId);
        await this.prisma.onchainOrder.update({
            where: { orderId },
            data: {
                status: 'RELEASED',
                releaseTxHash: result.txHash,
            },
        });
        return result;
    }
    async refundOnchainEscrow(orderId, networkType) {
        const adapter = this.getAdapter(networkType);
        const result = await adapter.refundEscrow(orderId);
        await this.prisma.onchainOrder.update({
            where: { orderId },
            data: {
                status: 'REFUNDED',
                refundTxHash: result.txHash,
            },
        });
        return result;
    }
    async getOnchainEscrowStatus(orderId, networkType) {
        const adapter = this.getAdapter(networkType);
        return adapter.getEscrowStatus(orderId);
    }
    async getOnchainBalance(address, networkType, tokenSymbol) {
        const adapter = this.getAdapter(networkType);
        const token = await this.getToken(networkType, tokenSymbol);
        if (!token) {
            throw new Error(`Token ${tokenSymbol} not supported on ${networkType}`);
        }
        return adapter.getBalance(address, token);
    }
    isValidAddress(address, networkType) {
        const adapter = this.getAdapter(networkType);
        return adapter.isValidAddress(address);
    }
    async getTokenIdFromSymbol(networkType, symbol) {
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkType },
        });
        if (!network)
            throw new Error(`Network ${networkType} not found`);
        const token = await this.prisma.token.findFirst({
            where: { networkId: network.id, symbol },
        });
        if (!token)
            throw new Error(`Token ${symbol} not found on ${networkType}`);
        return token.id;
    }
    async getWalletAddress(userId, networkName) {
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName, isActive: true },
        });
        if (!network)
            return null;
        const walletAddress = await this.prisma.walletAddress.findUnique({
            where: {
                userId_networkId: {
                    userId,
                    networkId: network.id,
                },
            },
        });
        return walletAddress?.address || null;
    }
    async setWalletAddress(userId, networkName, address) {
        const network = await this.prisma.blockchainNetwork.findFirst({
            where: { name: networkName, isActive: true },
        });
        if (!network) {
            throw new Error(`Network ${networkName} not found or inactive`);
        }
        if (!this.isValidAddress(address, networkName)) {
            throw new Error(`Invalid address format for ${networkName}`);
        }
        await this.prisma.walletAddress.upsert({
            where: {
                userId_networkId: {
                    userId,
                    networkId: network.id,
                },
            },
            create: {
                userId,
                networkId: network.id,
                address,
            },
            update: {
                address,
            },
        });
        return { success: true };
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        tron_adapter_1.TronAdapter,
        bsc_adapter_1.BscAdapter])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map
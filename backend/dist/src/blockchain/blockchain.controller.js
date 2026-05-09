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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const blockchain_service_1 = require("./blockchain.service");
const deposit_monitor_service_1 = require("./deposit-monitor.service");
let BlockchainController = class BlockchainController {
    blockchainService;
    depositMonitor;
    constructor(blockchainService, depositMonitor) {
        this.blockchainService = blockchainService;
        this.depositMonitor = depositMonitor;
    }
    async getNetworks() {
        return this.blockchainService.getSupportedNetworks();
    }
    async getTokens(network) {
        const networks = await this.blockchainService.getSupportedNetworks();
        const net = networks.find((n) => n.name === network);
        return net?.tokens || [];
    }
    async getBalance(address, network, token) {
        const networkType = network.toUpperCase();
        return {
            balance: await this.blockchainService.getOnchainBalance(address, networkType, token),
        };
    }
    async validateAddress(body) {
        const networkType = body.network.toUpperCase();
        return {
            valid: this.blockchainService.isValidAddress(body.address, networkType),
        };
    }
    async getWalletAddress(req, network) {
        const userId = req.user.userId;
        const address = await this.blockchainService.getWalletAddress(userId, network.toUpperCase());
        return { address };
    }
    async setWalletAddress(req, body) {
        const userId = req.user.userId;
        try {
            await this.blockchainService.setWalletAddress(userId, body.network.toUpperCase(), body.address);
            return { success: true };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createEscrow(req, body) {
        try {
            const result = await this.blockchainService.createOnchainEscrow(body.orderId, body.network.toUpperCase(), body.buyerAddress, body.sellerAddress, body.amount, body.token);
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async fundEscrow(req, body) {
        const userId = req.user.userId;
        const buyerAddress = await this.blockchainService.getWalletAddress(userId, body.network.toUpperCase());
        if (!buyerAddress) {
            throw new common_1.BadRequestException('请先设置钱包地址');
        }
        try {
            const result = await this.blockchainService.fundOnchainEscrow(body.orderId, body.network.toUpperCase(), buyerAddress, body.amount, body.token);
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getEscrowStatus(orderId, network) {
        return this.blockchainService.getOnchainEscrowStatus(orderId, network.toUpperCase());
    }
    async getDepositBalance(req, network) {
        const userId = req.user.userId;
        const networkUpper = network.toUpperCase();
        const address = await this.blockchainService.getWalletAddress(userId, networkUpper);
        if (!address) {
            return { balances: {}, address: null };
        }
        const networks = await this.blockchainService.getSupportedNetworks();
        const net = networks.find((n) => n.name === networkUpper);
        if (!net) {
            return { balances: {}, address };
        }
        const balances = {};
        for (const token of net.tokens) {
            const balance = await this.depositMonitor.getAddressBalance(address, networkUpper, token.symbol);
            balances[token.symbol] = balance;
        }
        return { balances, address };
    }
};
exports.BlockchainController = BlockchainController;
__decorate([
    (0, common_1.Get)('networks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getNetworks", null);
__decorate([
    (0, common_1.Get)('networks/:network/tokens'),
    __param(0, (0, common_1.Param)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getTokens", null);
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('address')),
    __param(1, (0, common_1.Query)('network')),
    __param(2, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('validate-address'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "validateAddress", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('wallet-address/:network'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getWalletAddress", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('wallet-address'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "setWalletAddress", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('escrow/create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "createEscrow", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('escrow/fund'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "fundEscrow", null);
__decorate([
    (0, common_1.Get)('escrow/status'),
    __param(0, (0, common_1.Query)('orderId')),
    __param(1, (0, common_1.Query)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getEscrowStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('deposit-balance/:network'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "getDepositBalance", null);
exports.BlockchainController = BlockchainController = __decorate([
    (0, common_1.Controller)('blockchain'),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService,
        deposit_monitor_service_1.DepositMonitorService])
], BlockchainController);
//# sourceMappingURL=blockchain.controller.js.map
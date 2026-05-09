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
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const wallets_service_1 = require("./wallets.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let WalletsController = class WalletsController {
    walletsService;
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    async getBalance(req) {
        return this.walletsService.getBalance(req.user.userId);
    }
    async deposit(req, body) {
        const network = body.network || 'TRON';
        const token = body.token || 'USDT';
        return this.walletsService.deposit(req.user.userId, body.amount, network, token, undefined, body.description);
    }
    async withdraw(req, body) {
        const network = body.network || 'TRON';
        const token = body.token || 'USDT';
        return this.walletsService.withdraw(req.user.userId, body.amount, body.address, network, token);
    }
    async getTransactions(req, skip, take) {
        const skipNum = parseInt(skip || '0', 10);
        const takeNum = parseInt(take || '20', 10);
        return this.walletsService.getTransactions(req.user.userId, skipNum, takeNum);
    }
    async getTokenBalance(req, network, token) {
        return this.walletsService.getTokenBalance(req.user.userId, network, token);
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('deposit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "deposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('token-balance'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('network')),
    __param(2, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getTokenBalance", null);
exports.WalletsController = WalletsController = __decorate([
    (0, common_1.Controller)('wallets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map
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
exports.TronController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const tron_address_service_1 = require("./tron-address.service");
const tron_monitor_service_1 = require("./tron-monitor.service");
const set_deposit_address_dto_1 = require("./dto/set-deposit-address.dto");
let TronController = class TronController {
    tronAddressService;
    tronMonitorService;
    constructor(tronAddressService, tronMonitorService) {
        this.tronAddressService = tronAddressService;
        this.tronMonitorService = tronMonitorService;
    }
    async getDepositAddress(req) {
        const address = await this.tronAddressService.getDepositAddress(req.user.userId);
        return { address };
    }
    async setDepositAddress(req, body) {
        await this.tronAddressService.setDepositAddress(req.user.userId, body.address);
        return { success: true, address: body.address };
    }
    async getDepositBalance(req) {
        const address = await this.tronAddressService.getDepositAddress(req.user.userId);
        if (!address) {
            return { balance: 0, address: null };
        }
        const balance = await this.tronMonitorService.getAddressBalance(address);
        return { balance, address };
    }
};
exports.TronController = TronController;
__decorate([
    (0, common_1.Get)('deposit-address'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TronController.prototype, "getDepositAddress", null);
__decorate([
    (0, common_1.Post)('deposit-address'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, set_deposit_address_dto_1.SetDepositAddressDto]),
    __metadata("design:returntype", Promise)
], TronController.prototype, "setDepositAddress", null);
__decorate([
    (0, common_1.Get)('deposit-balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TronController.prototype, "getDepositBalance", null);
exports.TronController = TronController = __decorate([
    (0, common_1.Controller)('tron'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tron_address_service_1.TronAddressService,
        tron_monitor_service_1.TronMonitorService])
], TronController);
//# sourceMappingURL=tron.controller.js.map
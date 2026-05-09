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
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const market_service_1 = require("./market.service");
let MarketController = class MarketController {
    marketService;
    constructor(marketService) {
        this.marketService = marketService;
    }
    async getPrices(symbols) {
        const symbolList = symbols?.split(',').map((s) => s.trim().toUpperCase()) || ['BTC', 'ETH', 'USDT', 'BNB', 'TRX'];
        return this.marketService.getPrices(symbolList);
    }
    async getHistory(symbol, days) {
        const dayCount = parseInt(days || '30', 10);
        return this.marketService.getHistory(symbol.toUpperCase(), dayCount);
    }
    async getKlines(symbol, interval, limit) {
        const intervalValue = interval || '1d';
        const limitValue = parseInt(limit || '100', 10);
        return this.marketService.getKlines(symbol.toUpperCase(), intervalValue, limitValue);
    }
    async getAllPrices() {
        return this.marketService.getAllPrices();
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)('prices'),
    __param(0, (0, common_1.Query)('symbols')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getPrices", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('klines'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('interval')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getKlines", null);
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getAllPrices", null);
exports.MarketController = MarketController = __decorate([
    (0, common_1.Controller)('market'),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], MarketController);
//# sourceMappingURL=market.controller.js.map
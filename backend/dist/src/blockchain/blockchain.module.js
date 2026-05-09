"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const blockchain_service_1 = require("./blockchain.service");
const blockchain_controller_1 = require("./blockchain.controller");
const deposit_monitor_service_1 = require("./deposit-monitor.service");
const tron_adapter_1 = require("./tron.adapter");
const bsc_adapter_1 = require("./bsc.adapter");
const prisma_module_1 = require("../prisma/prisma.module");
const wallets_module_1 = require("../wallets/wallets.module");
const auth_module_1 = require("../auth/auth.module");
let BlockchainModule = class BlockchainModule {
};
exports.BlockchainModule = BlockchainModule;
exports.BlockchainModule = BlockchainModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, wallets_module_1.WalletsModule, auth_module_1.AuthModule],
        controllers: [blockchain_controller_1.BlockchainController],
        providers: [blockchain_service_1.BlockchainService, deposit_monitor_service_1.DepositMonitorService, tron_adapter_1.TronAdapter, bsc_adapter_1.BscAdapter],
        exports: [blockchain_service_1.BlockchainService, deposit_monitor_service_1.DepositMonitorService],
    })
], BlockchainModule);
//# sourceMappingURL=blockchain.module.js.map
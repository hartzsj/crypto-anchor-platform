"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronModule = void 0;
const common_1 = require("@nestjs/common");
const tron_controller_1 = require("./tron.controller");
const tron_address_service_1 = require("./tron-address.service");
const tron_monitor_service_1 = require("./tron-monitor.service");
const prisma_module_1 = require("../prisma/prisma.module");
const wallets_module_1 = require("../wallets/wallets.module");
let TronModule = class TronModule {
};
exports.TronModule = TronModule;
exports.TronModule = TronModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, wallets_module_1.WalletsModule],
        controllers: [tron_controller_1.TronController],
        providers: [tron_address_service_1.TronAddressService, tron_monitor_service_1.TronMonitorService],
        exports: [tron_address_service_1.TronAddressService, tron_monitor_service_1.TronMonitorService],
    })
], TronModule);
//# sourceMappingURL=tron.module.js.map
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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminController = class AdminController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const totalUsers = await this.prisma.user.count();
        const totalItems = await this.prisma.item.count();
        const totalOrders = await this.prisma.order.count();
        const pendingItems = await this.prisma.item.count({ where: { status: 'PENDING' } });
        const disputedOrders = await this.prisma.order.count({ where: { status: 'DISPUTED' } });
        const completedOrders = await this.prisma.order.findMany({
            where: { status: 'COMPLETED' },
            select: { price: true },
        });
        const totalVolume = completedOrders.reduce((sum, o) => sum + Number(o.price), 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = await this.prisma.user.count({
            where: { createdAt: { gte: today } },
        });
        const newOrdersToday = await this.prisma.order.count({
            where: { createdAt: { gte: today } },
        });
        return {
            totalUsers,
            totalItems,
            totalOrders,
            pendingItems,
            disputedOrders,
            totalVolume,
            newUsersToday,
            newOrdersToday,
        };
    }
    async getAllOrders(status, skip, take) {
        const where = status ? { status: status } : {};
        const orders = await this.prisma.order.findMany({
            where,
            skip: skip || 0,
            take: take || 50,
            orderBy: { createdAt: 'desc' },
            include: {
                item: { select: { id: true, title: true, images: true } },
                buyer: { select: { id: true, nickname: true, email: true } },
                seller: { select: { id: true, nickname: true, email: true } },
            },
        });
        const total = await this.prisma.order.count({ where });
        return { orders, total };
    }
    async getDisputedOrders() {
        return this.prisma.order.findMany({
            where: { status: 'DISPUTED' },
            orderBy: { createdAt: 'desc' },
            include: {
                item: { select: { id: true, title: true, price: true } },
                buyer: { select: { id: true, nickname: true, reputation: true } },
                seller: { select: { id: true, nickname: true, reputation: true } },
            },
        });
    }
    async setUserRole(id, body) {
        return this.prisma.user.update({
            where: { id },
            data: { role: body.role },
            select: {
                id: true,
                email: true,
                nickname: true,
                role: true,
            },
        });
    }
    async setUserReputation(id, body) {
        return this.prisma.user.update({
            where: { id },
            data: { reputation: body.reputation },
            select: {
                id: true,
                nickname: true,
                reputation: true,
            },
        });
    }
    async getAllUsers(skip, take) {
        const users = await this.prisma.user.findMany({
            skip: skip || 0,
            take: take || 50,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                username: true,
                nickname: true,
                avatar: true,
                role: true,
                reputation: true,
                createdAt: true,
                wallet: {
                    select: {
                        balances: {
                            select: {
                                balance: true,
                                frozenBalance: true,
                                token: { select: { symbol: true } },
                            },
                        },
                    },
                },
            },
        });
        const total = await this.prisma.user.count();
        return { users, total };
    }
    async getItemStats() {
        const byStatus = await this.prisma.item.groupBy({
            by: ['status'],
            _count: true,
        });
        const byCategory = await this.prisma.item.groupBy({
            by: ['category'],
            _count: true,
        });
        return { byStatus, byCategory };
    }
    async getTransactions(skip, take) {
        return this.prisma.transaction.findMany({
            skip: skip || 0,
            take: take || 100,
            orderBy: { createdAt: 'desc' },
            include: {
                wallet: { select: { userId: true } },
                order: { select: { id: true, item: { select: { title: true } } } },
            },
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Get)('orders/disputed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDisputedOrders", null);
__decorate([
    (0, common_1.Put)('users/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setUserRole", null);
__decorate([
    (0, common_1.Put)('users/:id/reputation'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setUserReputation", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('items/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getItemStats", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransactions", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map
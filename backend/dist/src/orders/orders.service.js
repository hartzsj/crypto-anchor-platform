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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const items_service_1 = require("../items/items.service");
const notifications_service_1 = require("../notifications/notifications.service");
const schedule_1 = require("@nestjs/schedule");
let OrdersService = class OrdersService {
    prisma;
    walletsService;
    itemsService;
    notificationsService;
    constructor(prisma, walletsService, itemsService, notificationsService) {
        this.prisma = prisma;
        this.walletsService = walletsService;
        this.itemsService = itemsService;
        this.notificationsService = notificationsService;
    }
    async createOrder(buyerId, itemId) {
        const item = await this.itemsService.findOne(itemId);
        if (item.status !== 'APPROVED') {
            throw new common_1.BadRequestException('物品当前不可购买');
        }
        if (item.sellerId === buyerId) {
            throw new common_1.BadRequestException('不能购买自己的物品');
        }
        const buyerBalance = await this.walletsService.getTokenBalance(buyerId, 'TRON', 'USDT');
        if (buyerBalance.balance < Number(item.price)) {
            throw new common_1.BadRequestException('余额不足');
        }
        const order = await this.prisma.order.create({
            data: {
                itemId,
                buyerId,
                sellerId: item.sellerId,
                price: item.price,
                status: 'PENDING',
                autoConfirmAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            include: { item: true },
        });
        await this.notificationsService.sendBulkNotifications([buyerId, item.sellerId], notifications_service_1.NotificationType.ORDER_CREATED, { orderId: order.id, itemTitle: item.title });
        return order;
    }
    async payOrder(orderId, buyerId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('无权操作此订单');
        }
        if (order.status !== 'PENDING') {
            throw new common_1.BadRequestException('订单状态异常');
        }
        await this.walletsService.freezeFunds(buyerId, Number(order.price), 'TRON', 'USDT');
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
            include: { item: true },
        });
        await this.notificationsService.sendBulkNotifications([buyerId, order.sellerId], notifications_service_1.NotificationType.ORDER_PAID, { orderId: order.id, itemTitle: order.item?.title, amount: Number(order.price) });
        return updatedOrder;
    }
    async shipOrder(orderId, sellerId, logisticsCompany, trackingNumber) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('无权操作此订单');
        }
        if (order.status !== 'PAID') {
            throw new common_1.BadRequestException('订单未支付，无法发货');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                logisticsCompany,
                trackingNumber,
                shippedAt: new Date(),
            },
        });
        await this.notificationsService.sendNotification(order.buyerId, notifications_service_1.NotificationType.ORDER_SHIPPED, {
            orderId: order.id,
            itemTitle: order.item?.title,
            logisticsCompany,
            trackingNumber,
        });
        return updatedOrder;
    }
    async confirmReceipt(orderId, buyerId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('无权操作此订单');
        }
        if (order.status !== 'SHIPPED') {
            throw new common_1.BadRequestException('订单未发货');
        }
        return this.completeOrder(orderId);
    }
    async completeOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        await this.walletsService.transferToSeller(order.buyerId, order.sellerId, Number(order.price), orderId, 'TRON', 'USDT');
        await this.itemsService.markAsSold(order.itemId);
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        await this.notificationsService.sendBulkNotifications([order.buyerId, order.sellerId], notifications_service_1.NotificationType.ORDER_COMPLETED, { orderId: order.id, itemTitle: order.item?.title });
        return updatedOrder;
    }
    async cancelOrder(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new common_1.ForbiddenException('无权操作此订单');
        }
        if (order.status !== 'PENDING' && order.status !== 'PAID') {
            throw new common_1.BadRequestException('只能取消待支付或已支付的订单');
        }
        if (order.status === 'PAID') {
            await this.walletsService.refund(order.buyerId, Number(order.price), orderId, 'TRON', 'USDT');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELED',
                canceledAt: new Date(),
            },
        });
        await this.notificationsService.sendBulkNotifications([order.buyerId, order.sellerId], notifications_service_1.NotificationType.ORDER_CANCELED, { orderId: order.id, itemTitle: order.item?.title });
        return updatedOrder;
    }
    async disputeOrder(orderId, userId, reason) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.buyerId !== userId) {
            throw new common_1.ForbiddenException('只有买家可以发起争议');
        }
        if (order.status !== 'SHIPPED') {
            throw new common_1.BadRequestException('只能对已发货的订单发起争议');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'DISPUTED',
            },
        });
        await this.notificationsService.sendBulkNotifications([order.buyerId, order.sellerId], notifications_service_1.NotificationType.DISPUTE_OPENED, { orderId: order.id, itemTitle: order.item?.title, reason });
        return updatedOrder;
    }
    async resolveDispute(orderId, adminId, refund) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { item: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.status !== 'DISPUTED') {
            throw new common_1.BadRequestException('订单未处于争议状态');
        }
        if (refund) {
            await this.walletsService.refund(order.buyerId, Number(order.price), orderId, 'TRON', 'USDT');
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELED',
                    canceledAt: new Date(),
                },
            });
            await this.notificationsService.sendBulkNotifications([order.buyerId, order.sellerId], notifications_service_1.NotificationType.DISPUTE_RESOLVED, { orderId: order.id, itemTitle: order.item?.title, refund: true });
            return updatedOrder;
        }
        else {
            return this.completeOrder(orderId);
        }
    }
    async getMyBuyOrders(buyerId, skip = 0, take = 20) {
        const orders = await this.prisma.order.findMany({
            where: { buyerId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                item: true,
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
                review: true,
            },
        });
        const total = await this.prisma.order.count({ where: { buyerId } });
        return { orders, total };
    }
    async getMySellOrders(sellerId, skip = 0, take = 20) {
        const orders = await this.prisma.order.findMany({
            where: { sellerId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                item: true,
                buyer: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
                review: true,
            },
        });
        const total = await this.prisma.order.count({ where: { sellerId } });
        return { orders, total };
    }
    async getOne(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                item: true,
                buyer: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
                review: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new common_1.ForbiddenException('无权查看此订单');
        }
        return order;
    }
    async autoConfirmOrders() {
        const now = new Date();
        const orders = await this.prisma.order.findMany({
            where: {
                status: 'SHIPPED',
                autoConfirmAt: {
                    lte: now,
                },
            },
        });
        for (const order of orders) {
            try {
                await this.completeOrder(order.id);
                console.log(`✅ 订单 ${order.id} 自动确认收货`);
            }
            catch (error) {
                console.error(`❌ 订单 ${order.id} 自动确认失败:`, error);
            }
        }
    }
};
exports.OrdersService = OrdersService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersService.prototype, "autoConfirmOrders", null);
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallets_service_1.WalletsService,
        items_service_1.ItemsService,
        notifications_service_1.NotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map
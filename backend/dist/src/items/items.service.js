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
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ItemsService = class ItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(sellerId, title, description, images, price, category, location, serialNumber) {
        if (price <= 0) {
            throw new common_1.BadRequestException('价格必须大于0');
        }
        return this.prisma.item.create({
            data: {
                sellerId,
                title,
                description,
                images,
                price,
                category,
                location,
                serialNumber,
                status: 'PENDING',
            },
        });
    }
    async findAll(skip = 0, take = 20, filters) {
        const where = {};
        if (filters?.category) {
            where.category = filters.category;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        else {
            where.status = 'APPROVED';
        }
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.minPrice || filters?.maxPrice) {
            where.price = {};
            if (filters.minPrice) {
                where.price.gte = filters.minPrice;
            }
            if (filters.maxPrice) {
                where.price.lte = filters.maxPrice;
            }
        }
        const items = await this.prisma.item.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        reputation: true,
                    },
                },
            },
        });
        const total = await this.prisma.item.count({ where });
        return { items, total };
    }
    async findOne(id) {
        const item = await this.prisma.item.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        reputation: true,
                    },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('物品不存在');
        }
        return item;
    }
    async findBySellerId(sellerId, skip = 0, take = 20) {
        const items = await this.prisma.item.findMany({
            where: { sellerId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
        const total = await this.prisma.item.count({ where: { sellerId } });
        return { items, total };
    }
    async approve(itemId, adminId) {
        const item = await this.prisma.item.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new common_1.NotFoundException('物品不存在');
        }
        return this.prisma.item.update({
            where: { id: itemId },
            data: {
                status: 'APPROVED',
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });
    }
    async reject(itemId, reason, adminId) {
        const item = await this.prisma.item.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new common_1.NotFoundException('物品不存在');
        }
        return this.prisma.item.update({
            where: { id: itemId },
            data: {
                status: 'REJECTED',
                rejectedReason: reason,
                approvedBy: adminId,
            },
        });
    }
    async markAsSold(itemId) {
        return this.prisma.item.update({
            where: { id: itemId },
            data: {
                status: 'SOLD',
            },
        });
    }
    async remove(itemId, userId, userRole) {
        const item = await this.prisma.item.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new common_1.NotFoundException('物品不存在');
        }
        if (item.sellerId !== userId && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('无权删除此物品');
        }
        return this.prisma.item.delete({
            where: { id: itemId },
        });
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map
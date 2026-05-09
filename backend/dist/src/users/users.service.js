"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(email, username, password, nickname) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                nickname,
            },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                wallet: true,
            },
        });
    }
    async updateReputation(userId, delta) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                reputation: {
                    increment: delta || 0,
                },
            },
        });
    }
    async findAll(skip = 0, take = 20) {
        return this.prisma.user.findMany({
            skip,
            take,
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
            },
        });
    }
    async updateRole(userId, role) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }
    async updateProfile(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                nickname: data.nickname,
                avatar: data.avatar,
            },
            select: {
                id: true,
                email: true,
                username: true,
                nickname: true,
                avatar: true,
                reputation: true,
            },
        });
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('旧密码错误');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { success: true };
    }
    async getUserStats(userId) {
        const itemsCount = await this.prisma.item.count({
            where: { sellerId: userId },
        });
        const buyOrdersCount = await this.prisma.order.count({
            where: { buyerId: userId },
        });
        const sellOrdersCount = await this.prisma.order.count({
            where: { sellerId: userId },
        });
        const reviewsReceived = await this.prisma.review.findMany({
            where: { revieweeId: userId },
            select: { rating: true },
        });
        const reviewsGivenCount = await this.prisma.review.count({
            where: { reviewerId: userId },
        });
        const avgRating = reviewsReceived.length > 0
            ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
            : 0;
        const goodReviews = reviewsReceived.filter(r => r.rating >= 4).length;
        const goodRate = reviewsReceived.length > 0
            ? (goodReviews / reviewsReceived.length) * 100
            : 100;
        return {
            itemsCount,
            buyOrdersCount,
            sellOrdersCount,
            totalOrders: buyOrdersCount + sellOrdersCount,
            reviewsReceivedCount: reviewsReceived.length,
            reviewsGivenCount,
            avgRating: Math.round(avgRating * 10) / 10,
            goodRate: Math.round(goodRate),
        };
    }
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
                reputation: true,
                createdAt: true,
            },
        });
        if (!user) {
            return null;
        }
        const stats = await this.getUserStats(userId);
        return { ...user, stats };
    }
    async getUserItems(userId, skip = 0, take = 20) {
        return this.prisma.item.findMany({
            where: {
                sellerId: userId,
                status: 'APPROVED',
            },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getUserReviews(userId, skip = 0, take = 20) {
        return this.prisma.review.findMany({
            where: { revieweeId: userId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        nickname: true,
                        avatar: true,
                    },
                },
                order: {
                    select: {
                        item: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map
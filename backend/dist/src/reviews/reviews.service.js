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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let ReviewsService = class ReviewsService {
    prisma;
    usersService;
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async createReview(orderId, reviewerId, rating, comment) {
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('评分必须在1-5之间');
        }
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        if (order.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('只能对已完成的订单进行评价');
        }
        const existingReview = await this.prisma.review.findUnique({
            where: { orderId },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('该订单已经评价过');
        }
        let revieweeId;
        if (order.buyerId === reviewerId) {
            revieweeId = order.sellerId;
        }
        else if (order.sellerId === reviewerId) {
            revieweeId = order.buyerId;
        }
        else {
            throw new common_1.ForbiddenException('无权评价此订单');
        }
        const review = await this.prisma.review.create({
            data: {
                orderId,
                reviewerId,
                revieweeId,
                rating,
                comment,
            },
        });
        const reputationDelta = {
            5: 5,
            4: 3,
            3: 0,
            2: -3,
            1: -5,
        }[rating] || 0;
        await this.usersService.updateReputation(revieweeId, reputationDelta);
        return review;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map
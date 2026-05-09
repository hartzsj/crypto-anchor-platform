import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  // 创建评价
  async createReview(
    orderId: string,
    reviewerId: string,
    rating: number,
    comment?: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('评分必须在1-5之间');
    }

    // 检查订单是否存在且已完成
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('只能对已完成的订单进行评价');
    }

    // 检查是否已经评价过
    const existingReview = await this.prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      throw new BadRequestException('该订单已经评价过');
    }

    // 确定评价对象（买家评价卖家，或卖家评价买家）
    let revieweeId: string;
    if (order.buyerId === reviewerId) {
      revieweeId = order.sellerId;
    } else if (order.sellerId === reviewerId) {
      revieweeId = order.buyerId;
    } else {
      throw new ForbiddenException('无权评价此订单');
    }

    // 创建评价
    const review = await this.prisma.review.create({
      data: {
        orderId,
        reviewerId,
        revieweeId,
        rating,
        comment,
      },
    });

    // 更新被评价用户的信誉分
    // 5星 +5分，4星 +3分，3星 0分，2星 -3分，1星 -5分
    const reputationDelta = {
      5: 5,
      4: 3,
      3: 0,
      2: -3,
      1: -5,
    }[rating] || 0;

    await this.usersService.updateReputation(revieweeId, reputationDelta!);

    return review;
  }
}

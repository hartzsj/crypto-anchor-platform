import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, username: string, password: string, nickname: string) {
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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });
  }

  async updateReputation(userId: string, delta: number) {
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

  async updateRole(userId: string, role: 'USER' | 'ADMIN') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, data: { nickname?: string; bio?: string; avatar?: string }) {
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

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('旧密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: string) {
    // 发布的物品数
    const itemsCount = await this.prisma.item.count({
      where: { sellerId: userId },
    });

    // 作为买家的订单数
    const buyOrdersCount = await this.prisma.order.count({
      where: { buyerId: userId },
    });

    // 作为卖家的订单数
    const sellOrdersCount = await this.prisma.order.count({
      where: { sellerId: userId },
    });

    // 收到的评价
    const reviewsReceived = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });

    // 给出的评价
    const reviewsGivenCount = await this.prisma.review.count({
      where: { reviewerId: userId },
    });

    // 计算平均评分
    const avgRating = reviewsReceived.length > 0
      ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
      : 0;

    // 好评率（4-5星为好评）
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

  /**
   * 获取用户公开信息
   */
  async getPublicProfile(userId: string) {
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

    // 获取统计信息
    const stats = await this.getUserStats(userId);

    return { ...user, stats };
  }

  /**
   * 获取用户发布的物品（公开）
   */
  async getUserItems(userId: string, skip = 0, take = 20) {
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

  /**
   * 获取用户收到的评价
   */
  async getUserReviews(userId: string, skip = 0, take = 20) {
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
}

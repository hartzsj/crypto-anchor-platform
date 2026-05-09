import { Controller, Get, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  // 平台统计
  @Get('stats')
  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalItems = await this.prisma.item.count();
    const totalOrders = await this.prisma.order.count();
    const pendingItems = await this.prisma.item.count({ where: { status: 'PENDING' } });
    const disputedOrders = await this.prisma.order.count({ where: { status: 'DISPUTED' } });

    // 计算总交易额（已完成的订单）
    const completedOrders = await this.prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { price: true },
    });
    const totalVolume = completedOrders.reduce((sum, o) => sum + Number(o.price), 0);

    // 今日新增
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

  // 获取所有订单
  @Get('orders')
  async getAllOrders(
    @Query('status') status?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const where = status ? { status: status as any } : {};

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

  // 获取争议订单
  @Get('orders/disputed')
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

  // 设置用户角色
  @Put('users/:id/role')
  async setUserRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'ADMIN' }) {
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

  // 调整用户信誉分
  @Put('users/:id/reputation')
  async setUserReputation(@Param('id') id: string, @Body() body: { reputation: number }) {
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

  // 获取所有用户（详细）
  @Get('users')
  async getAllUsers(@Query('skip') skip?: number, @Query('take') take?: number) {
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
        wallet: { select: { balance: true, frozenBalance: true } },
      },
    });

    const total = await this.prisma.user.count();

    return { users, total };
  }

  // 获取物品统计
  @Get('items/stats')
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

  // 获取交易记录
  @Get('transactions')
  async getTransactions(@Query('skip') skip?: number, @Query('take') take?: number) {
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
}
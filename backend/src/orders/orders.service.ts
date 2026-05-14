import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { ItemsService } from '../items/items.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
    private itemsService: ItemsService,
    private notificationsService: NotificationsService,
  ) {}

  // 创建订单（买家下单）
  async createOrder(buyerId: string, itemId: string) {
    // 检查物品是否存在且可购买
    const item = await this.itemsService.findOne(itemId);
    
    if (item.status !== 'APPROVED') {
      throw new BadRequestException('物品当前不可购买');
    }

    if (item.sellerId === buyerId) {
      throw new BadRequestException('不能购买自己的物品');
    }

    // 检查买家是否有足够余额
    const buyerBalance = await this.walletsService.getTokenBalance(buyerId, 'TRON', 'USDT');
    if (buyerBalance.balance < Number(item.price)) {
      throw new BadRequestException('余额不足');
    }

    // 创建订单
    const order = await this.prisma.order.create({
      data: {
        itemId,
        buyerId,
        sellerId: item.sellerId,
        price: item.price,
        status: 'PENDING',
        autoConfirmAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后自动确认
      },
      include: { item: true },
    });

    // 发送通知给买家和卖家
    await this.notificationsService.sendBulkNotifications(
      [buyerId, item.sellerId],
      NotificationType.ORDER_CREATED,
      { orderId: order.id, itemTitle: item.title },
    );

    return order;
  }

  // 支付订单（锁定资金）
  async payOrder(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('订单状态异常');
    }

    // 冻结买家资金
    await this.walletsService.freezeFunds(buyerId, Number(order.price), 'TRON', 'USDT');

    // 更新订单状态
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: { item: true },
    });

    // 发送通知给买家和卖家
    await this.notificationsService.sendBulkNotifications(
      [buyerId, order.sellerId],
      NotificationType.ORDER_PAID,
      { orderId: order.id, itemTitle: order.item?.title, amount: Number(order.price) },
    );

    return updatedOrder;
  }

  // 发货（卖家填写物流信息）
  async shipOrder(orderId: string, sellerId: string, logisticsCompany: string, trackingNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException('订单未支付，无法发货');
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

    // 发送通知给买家
    await this.notificationsService.sendNotification(
      order.buyerId,
      NotificationType.ORDER_SHIPPED,
      {
        orderId: order.id,
        itemTitle: order.item?.title,
        logisticsCompany,
        trackingNumber,
      },
    );

    return updatedOrder;
  }

  // 确认收货（买家）
  async confirmReceipt(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== 'SHIPPED') {
      throw new BadRequestException('订单未发货');
    }

    return this.completeOrder(orderId);
  }

  // 完成订单（释放资金给卖家）
  private async completeOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 在事务中查询并锁定订单
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { item: true },
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      // 检查订单状态，防止重复完成
      if (order.status !== 'SHIPPED' && order.status !== 'DISPUTED') {
        throw new BadRequestException(`订单状态为 ${order.status}，无法完成`);
      }

      // 释放资金给卖家
      const buyerWallet = await tx.wallet.findUnique({
        where: { userId: order.buyerId },
      });

      const sellerWallet = await tx.wallet.findUnique({
        where: { userId: order.sellerId },
      });

      if (!buyerWallet || !sellerWallet) {
        throw new NotFoundException('钱包不存在');
      }

      // 获取代币信息
      const network = await tx.blockchainNetwork.findFirst({
        where: { name: 'TRON' },
      });

      const token = await tx.token.findFirst({
        where: { networkId: network!.id, symbol: 'USDT' },
      });

      if (!token) {
        throw new BadRequestException('代币不存在');
      }

      // 检查买家冻结余额
      const buyerBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_tokenId: {
            walletId: buyerWallet.id,
            tokenId: token.id,
          },
        },
      });

      const amount = Number(order.price);
      if (!buyerBalance || Number(buyerBalance.frozenBalance) < amount) {
        throw new BadRequestException('冻结资金不足');
      }

      // 获取卖家当前余额
      const sellerBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_tokenId: {
            walletId: sellerWallet.id,
            tokenId: token.id,
          },
        },
      });

      const sellerBalanceBefore = sellerBalance ? Number(sellerBalance.balance) : 0;
      const sellerBalanceAfter = sellerBalanceBefore + amount;

      // 从买家冻结扣除
      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: buyerWallet.id,
            tokenId: token.id,
          },
        },
        data: {
          frozenBalance: { decrement: amount },
        },
      });

      // 加到卖家余额
      if (sellerBalance) {
        await tx.walletBalance.update({
          where: {
            walletId_tokenId: {
              walletId: sellerWallet.id,
              tokenId: token.id,
            },
          },
          data: {
            balance: sellerBalanceAfter,
          },
        });
      } else {
        await tx.walletBalance.create({
          data: {
            walletId: sellerWallet.id,
            tokenId: token.id,
            balance: sellerBalanceAfter,
            frozenBalance: 0,
          },
        });
      }

      // 记录交易
      await tx.transaction.create({
        data: {
          walletId: sellerWallet.id,
          tokenId: token.id,
          type: 'ORDER_RELEASE',
          amount: amount,
          balanceBefore: sellerBalanceBefore,
          balanceAfter: sellerBalanceAfter,
          orderId,
          description: '订单完成，资金释放',
        },
      });

      // 标记物品为已售出
      await tx.item.update({
        where: { id: order.itemId },
        data: { status: 'SOLD' },
      });

      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 发送通知给买家和卖家（事务外处理）
      // 注意：通知发送应该在事务成功后进行
      return { order: updatedOrder, itemTitle: order.item?.title };
    }).then(async (result) => {
      // 事务成功后发送通知
      await this.notificationsService.sendBulkNotifications(
        [result.order.buyerId, result.order.sellerId],
        NotificationType.ORDER_COMPLETED,
        { orderId: result.order.id, itemTitle: result.itemTitle },
      );
      return result.order;
    });
  }

  // 取消订单
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== 'PENDING' && order.status !== 'PAID') {
      throw new BadRequestException('只能取消待支付或已支付的订单');
    }

    // 如果已支付，需要退款解冻资金
    if (order.status === 'PAID') {
      await this.walletsService.refund(order.buyerId, Number(order.price), orderId, 'TRON', 'USDT');
    }

    // 更新订单状态
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    // 发送通知给买家和卖家
    await this.notificationsService.sendBulkNotifications(
      [order.buyerId, order.sellerId],
      NotificationType.ORDER_CANCELED,
      { orderId: order.id, itemTitle: order.item?.title },
    );

    return updatedOrder;
  }

  // 发起争议
  async disputeOrder(orderId: string, userId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('只有买家可以发起争议');
    }

    if (order.status !== 'SHIPPED') {
      throw new BadRequestException('只能对已发货的订单发起争议');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DISPUTED',
      },
    });

    // 发送通知给买家和卖家
    await this.notificationsService.sendBulkNotifications(
      [order.buyerId, order.sellerId],
      NotificationType.DISPUTE_OPENED,
      { orderId: order.id, itemTitle: order.item?.title, reason },
    );

    return updatedOrder;
  }

  // 仲裁处理（管理员）
  async resolveDispute(orderId: string, adminId: string, refund: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'DISPUTED') {
      throw new BadRequestException('订单未处于争议状态');
    }

    if (refund) {
      // 退款给买家
      await this.walletsService.refund(order.buyerId, Number(order.price), orderId, 'TRON', 'USDT');

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      // 发送通知给买家和卖家
      await this.notificationsService.sendBulkNotifications(
        [order.buyerId, order.sellerId],
        NotificationType.DISPUTE_RESOLVED,
        { orderId: order.id, itemTitle: order.item?.title, refund: true },
      );

      return updatedOrder;
    } else {
      // 放款给卖家
      return this.completeOrder(orderId);
    }
  }

  // 获取我的购买订单
  async getMyBuyOrders(buyerId: string, skip = 0, take = 20) {
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

  // 获取我的销售订单
  async getMySellOrders(sellerId: string, skip = 0, take = 20) {
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

  // 获取单个订单详情
  async getOne(orderId: string, userId: string) {
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
      throw new NotFoundException('订单不存在');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('无权查看此订单');
    }

    return order;
  }

  // 定时任务：自动确认收货（超时7天未确认自动完成）
  @Cron(CronExpression.EVERY_HOUR)
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
      } catch (error) {
        console.error(`❌ 订单 ${order.id} 自动确认失败:`, error);
      }
    }
  }
}

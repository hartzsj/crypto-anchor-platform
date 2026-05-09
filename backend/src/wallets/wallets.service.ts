import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  // 获取或创建钱包
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          frozenBalance: 0,
        },
      });
    }

    return wallet;
  }

  // 查询余额
  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: Number(wallet.balance),
      frozenBalance: Number(wallet.frozenBalance),
      total: Number(wallet.balance) + Number(wallet.frozenBalance),
    };
  }

  // 充值
  async deposit(userId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('充值金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: balanceAfter,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: description || '充值',
        },
      });

      return updatedWallet;
    });
  }

  // 提现
  async withdraw(userId: string, amount: number, address: string) {
    if (amount <= 0) {
      throw new BadRequestException('提现金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);
    
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('余额不足');
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore - amount;

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: balanceAfter,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAW',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `提现到地址: ${address}`,
        },
      });

      return updatedWallet;
    });
  }

  // 冻结资金（下单时）
  async freezeFunds(userId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('余额不足');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });
    });
  }

  // 释放资金（订单完成时）
  async releaseFunds(userId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          frozenBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });
    });
  }

  // 转账给卖家（订单完成时从冻结账户直接转给卖家）
  async transferToSeller(buyerId: string, sellerId: string, amount: number, orderId: string) {
    const buyerWallet = await this.getOrCreateWallet(buyerId);
    const sellerWallet = await this.getOrCreateWallet(sellerId);

    if (Number(buyerWallet.frozenBalance) < amount) {
      throw new BadRequestException('冻结资金不足');
    }

    const sellerBalanceBefore = Number(sellerWallet.balance);
    const sellerBalanceAfter = sellerBalanceBefore + amount;

    return this.prisma.$transaction(async (tx) => {
      // 从买家冻结扣除
      await tx.wallet.update({
        where: { userId: buyerId },
        data: {
          frozenBalance: { decrement: amount },
        },
      });

      // 加到卖家余额
      const updatedSellerWallet = await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          balance: sellerBalanceAfter,
        },
      });

      // 记录交易
      await tx.transaction.create({
        data: {
          walletId: sellerWallet.id,
          type: 'ORDER_RELEASE',
          amount: amount,
          balanceBefore: sellerBalanceBefore,
          balanceAfter: sellerBalanceAfter,
          orderId,
          description: '订单完成，资金释放',
        },
      });

      return updatedSellerWallet;
    });
  }

  // 退款（订单取消时解冻并退回）
  async refund(userId: string, amount: number, orderId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.frozenBalance) < amount) {
      throw new BadRequestException('冻结资金不足');
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          frozenBalance: { decrement: amount },
          balance: balanceAfter,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ORDER_REFUND',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          orderId,
          description: '订单取消，资金退回',
        },
      });

      return updatedWallet;
    });
  }

  // 获取交易记录
  async getTransactions(userId: string, skip = 0, take = 20) {
    const wallet = await this.getOrCreateWallet(userId);
    
    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}

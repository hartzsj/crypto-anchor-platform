import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  // 获取或创建钱包
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        balances: {
          include: {
            token: {
              include: { network: true },
            },
          },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: {
          balances: {
            include: {
              token: {
                include: { network: true },
              },
            },
          },
        },
      });
    }

    return wallet;
  }

  // 查询余额（多币种）
  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    // 获取所有支持的网络和代币
    const networks = await this.prisma.blockchainNetwork.findMany({
      where: { isActive: true },
      include: { tokens: { where: { isActive: true } } },
    });

    // 为每个代币初始化余额（如果不存在）
    for (const network of networks) {
      for (const token of network.tokens) {
        const existingBalance = wallet.balances.find(
          (b) => b.tokenId === token.id
        );

        if (!existingBalance) {
          await this.prisma.walletBalance.create({
            data: {
              walletId: wallet.id,
              tokenId: token.id,
              balance: 0,
              frozenBalance: 0,
            },
          });
        }
      }
    }

    // 重新获取钱包余额
    const updatedWallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        balances: {
          include: {
            token: {
              include: { network: true },
            },
          },
        },
      },
    });

    return {
      balances: updatedWallet!.balances.map((b) => ({
        id: b.id,
        symbol: b.token.symbol,
        network: b.token.network.name,
        balance: Number(b.balance),
        frozenBalance: Number(b.frozenBalance),
        decimals: b.token.decimals,
      })),
    };
  }

  // 获取指定代币余额
  async getTokenBalance(userId: string, networkName: string, tokenSymbol: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName, isActive: true },
    });

    if (!network) {
      throw new BadRequestException(`网络 ${networkName} 不存在或未激活`);
    }

    const token = await this.prisma.token.findFirst({
      where: {
        networkId: network.id,
        symbol: tokenSymbol,
        isActive: true,
      },
    });

    if (!token) {
      throw new BadRequestException(`代币 ${tokenSymbol} 在 ${networkName} 上不存在或未激活`);
    }

    let balance = await this.prisma.walletBalance.findUnique({
      where: {
        walletId_tokenId: {
          walletId: wallet.id,
          tokenId: token.id,
        },
      },
    });

    if (!balance) {
      balance = await this.prisma.walletBalance.create({
        data: {
          walletId: wallet.id,
          tokenId: token.id,
          balance: 0,
          frozenBalance: 0,
        },
      });
    }

    return {
      balance: Number(balance.balance),
      frozenBalance: Number(balance.frozenBalance),
    };
  }

  // 充值（指定代币）
  async deposit(
    userId: string,
    amount: number,
    networkName: string,
    tokenSymbol: string,
    txHash?: string,
    description?: string
  ) {
    if (amount <= 0) {
      throw new BadRequestException('充值金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);
    const { balance: balanceBefore } = await this.getTokenBalance(userId, networkName, tokenSymbol);
    const balanceAfter = balanceBefore + amount;

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    const token = await this.prisma.token.findFirst({
      where: { networkId: network!.id, symbol: tokenSymbol },
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token!.id,
          },
        },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          tokenId: token!.id,
          type: 'DEPOSIT',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          txHash: txHash,
          description: description || `${networkName} ${tokenSymbol} 充值`,
        },
      });

      return { balance: balanceAfter };
    });
  }

  // 提现（指定代币）
  async withdraw(
    userId: string,
    amount: number,
    address: string,
    networkName: string,
    tokenSymbol: string
  ) {
    if (amount <= 0) {
      throw new BadRequestException('提现金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);
    const { balance: balanceBefore } = await this.getTokenBalance(userId, networkName, tokenSymbol);

    if (balanceBefore < amount) {
      throw new BadRequestException('余额不足');
    }

    const balanceAfter = balanceBefore - amount;

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    const token = await this.prisma.token.findFirst({
      where: { networkId: network!.id, symbol: tokenSymbol },
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token!.id,
          },
        },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          tokenId: token!.id,
          type: 'WITHDRAW',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `提现到地址: ${address}`,
        },
      });

      return { balance: balanceAfter };
    });
  }

  // 冻结资金（下单时，指定代币）
  async freezeFunds(userId: string, amount: number, networkName: string, tokenSymbol: string) {
    if (amount <= 0) {
      throw new BadRequestException('冻结金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    if (!network) {
      throw new BadRequestException(`网络 ${networkName} 不存在`);
    }

    const token = await this.prisma.token.findFirst({
      where: { networkId: network.id, symbol: tokenSymbol },
    });

    if (!token) {
      throw new BadRequestException(`代币 ${tokenSymbol} 不存在`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 在事务中重新查询余额，防止竞态条件
      const currentBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token.id,
          },
        },
      });

      if (!currentBalance || Number(currentBalance.balance) < amount) {
        throw new BadRequestException('余额不足');
      }

      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token.id,
          },
        },
        data: {
          balance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });
    });
  }

  // 释放资金（订单完成时，指定代币）
  async releaseFunds(userId: string, amount: number, networkName: string, tokenSymbol: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    const token = await this.prisma.token.findFirst({
      where: { networkId: network!.id, symbol: tokenSymbol },
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token!.id,
          },
        },
        data: {
          frozenBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });
    });
  }

  // 转账给卖家（订单完成时从冻结账户直接转给卖家，指定代币）
  async transferToSeller(
    buyerId: string,
    sellerId: string,
    amount: number,
    orderId: string,
    networkName: string,
    tokenSymbol: string
  ) {
    if (amount <= 0) {
      throw new BadRequestException('转账金额必须大于0');
    }

    const buyerWallet = await this.getOrCreateWallet(buyerId);
    const sellerWallet = await this.getOrCreateWallet(sellerId);

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    if (!network) {
      throw new BadRequestException(`网络 ${networkName} 不存在`);
    }

    const token = await this.prisma.token.findFirst({
      where: { networkId: network.id, symbol: tokenSymbol },
    });

    if (!token) {
      throw new BadRequestException(`代币 ${tokenSymbol} 不存在`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 在事务中重新查询冻结余额，防止竞态条件
      const buyerBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_tokenId: {
            walletId: buyerWallet.id,
            tokenId: token.id,
          },
        },
      });

      if (!buyerBalance || Number(buyerBalance.frozenBalance) < amount) {
        throw new BadRequestException('冻结资金不足');
      }

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

      // 加到卖家余额（如果不存在则创建）
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
    });
  }

  // 退款（订单取消时解冻并退回，指定代币）
  async refund(userId: string, amount: number, orderId: string, networkName: string, tokenSymbol: string) {
    if (amount <= 0) {
      throw new BadRequestException('退款金额必须大于0');
    }

    const wallet = await this.getOrCreateWallet(userId);

    const network = await this.prisma.blockchainNetwork.findFirst({
      where: { name: networkName },
    });

    if (!network) {
      throw new BadRequestException(`网络 ${networkName} 不存在`);
    }

    const token = await this.prisma.token.findFirst({
      where: { networkId: network.id, symbol: tokenSymbol },
    });

    if (!token) {
      throw new BadRequestException(`代币 ${tokenSymbol} 不存在`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 在事务中重新查询冻结余额，防止竞态条件
      const currentBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token.id,
          },
        },
      });

      if (!currentBalance || Number(currentBalance.frozenBalance) < amount) {
        throw new BadRequestException('冻结资金不足');
      }

      const balanceBefore = Number(currentBalance.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.walletBalance.update({
        where: {
          walletId_tokenId: {
            walletId: wallet.id,
            tokenId: token.id,
          },
        },
        data: {
          frozenBalance: { decrement: amount },
          balance: balanceAfter,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          tokenId: token.id,
          type: 'ORDER_REFUND',
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          orderId,
          description: '订单取消，资金退回',
        },
      });
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

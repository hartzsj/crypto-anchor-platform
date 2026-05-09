import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TronAddressService {
  private readonly logger = new Logger(TronAddressService.name);
  private prisma: PrismaService;

  constructor(
    private configService: ConfigService,
    prisma: PrismaService,
  ) {
    this.prisma = prisma;
  }

  /**
   * 获取用户TRON充值地址
   */
  async getDepositAddress(userId: string): Promise<string | null> {
    const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
      where: { name: 'TRON', isActive: true },
    });

    if (!tronNetwork) {
      this.logger.error('TRON network not found');
      return null;
    }

    const walletAddress = await this.prisma.walletAddress.findUnique({
      where: {
        userId_networkId: {
          userId,
          networkId: tronNetwork.id,
        },
      },
    });

    return walletAddress?.address || null;
  }

  /**
   * 设置用户充值地址（用户手动提供）
   */
  async setDepositAddress(userId: string, address: string): Promise<void> {
    // 验证TRON地址格式
    if (!this.isValidTronAddress(address)) {
      throw new Error('无效的TRON地址格式');
    }

    const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
      where: { name: 'TRON', isActive: true },
    });

    if (!tronNetwork) {
      throw new Error('TRON network not found');
    }

    // 检查地址是否已被使用
    const existing = await this.prisma.walletAddress.findFirst({
      where: { address },
    });

    if (existing && existing.userId !== userId) {
      throw new Error('该地址已被其他用户使用');
    }

    // 创建或更新钱包地址
    await this.prisma.walletAddress.upsert({
      where: {
        userId_networkId: {
          userId,
          networkId: tronNetwork.id,
        },
      },
      create: {
        userId,
        networkId: tronNetwork.id,
        address,
      },
      update: {
        address,
      },
    });

    this.logger.log(`用户 ${userId} 设置TRON充值地址: ${address}`);
  }

  /**
   * 验证TRON地址格式
   */
  private isValidTronAddress(address: string): boolean {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  }
}
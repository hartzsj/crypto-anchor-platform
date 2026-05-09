import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// TronWeb 用于生成地址（简化版，实际部署需要完整TronWeb库）
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
   * 为用户生成充值地址
   * 实际部署需要：1. 生成TRON私钥 2. 导出地址 3. 安全存储私钥
   *
   * 这里提供两种方案：
   *
   * 方案A（生产推荐）：
   * - 使用HD钱包，从主私钥派生用户充值地址
   * - 私钥集中管理，安全可控
   *
   * 方案B（简化版）：
   * - 每个用户生成独立地址和私钥
   * - 私钥加密存储在数据库
   */
  async generateDepositAddress(userId: string): Promise<string> {
    // 检查是否已有地址
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (wallet?.depositAddress) {
      return wallet.depositAddress;
    }

    // 生产环境：使用TronWeb生成地址
    // const TronWeb = require('tronweb');
    // const tronWeb = new TronWeb({
    //   fullHost: 'https://api.trongrid.io',
    //   privateKey: this.configService.get('TRON_MASTER_PRIVATE_KEY'),
    // });
    // const account = tronWeb.utils.accounts.generateAccountWithMnemonic();

    // 简化版：用户自己提供充值地址
    // 实际部署请替换为真实地址生成逻辑
    const depositAddress = await this.createOrGetAddress(userId);

    // 更新钱包
    await this.prisma.wallet.update({
      where: { userId },
      data: { depositAddress },
    });

    this.logger.log(`用户 ${userId} 充值地址: ${depositAddress}`);

    return depositAddress;
  }

  /**
   * 创建或获取充值地址
   *
   * 生产环境实现：
   * 1. 从主私钥派生：tronWeb.fromMnemonic(mnemonic, index)
   * 2. 存储派生索引，用于后续归集资金
   *
   * 测试环境：用户手动设置已有地址
   */
  private async createOrGetAddress(userId: string): Promise<string> {
    // 生产环境代码示例：
    // const masterKey = this.configService.get('TRON_MASTER_PRIVATE_KEY');
    // const index = await this.getNextAddressIndex();
    // const childKey = deriveChildKey(masterKey, index);
    // const address = getAddressFromPrivateKey(childKey);
    // await this.storeKeyIndex(userId, index, childKey);
    // return address;

    // 测试环境：返回用户需要手动设置的提示
    // 用户需要在钱包页面设置自己的TRON地址
    return `TUser${userId.slice(0, 8)}DepositAddressPending`;
  }

  /**
   * 设置用户充值地址（用户手动提供）
   */
  async setDepositAddress(userId: string, address: string): Promise<void> {
    // 验证TRON地址格式
    if (!this.isValidTronAddress(address)) {
      throw new Error('无效的TRON地址格式');
    }

    // 检查地址是否已被使用
    const existing = await this.prisma.wallet.findFirst({
      where: { depositAddress: address },
    });

    if (existing && existing.userId !== userId) {
      throw new Error('该地址已被其他用户使用');
    }

    await this.prisma.wallet.update({
      where: { userId },
      data: { depositAddress: address },
    });

    this.logger.log(`用户 ${userId} 设置充值地址: ${address}`);
  }

  /**
   * 验证TRON地址格式
   */
  private isValidTronAddress(address: string): boolean {
    // TRON地址以T开头，长度34
    return /^T[A-Za-z1-9]{33}$/.test(address);
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

// TRON USDT合约地址 (TRC-20)
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// TronGrid API
const TRONGRID_API = 'https://api.trongrid.io';

@Injectable()
export class TronMonitorService {
  private readonly logger = new Logger(TronMonitorService.name);
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private walletsService: WalletsService,
  ) {
    this.apiKey = this.configService.get('TRONGRID_API_KEY') || '';
  }

  /**
   * 定时扫描用户充值地址的USDT入账
   * 每30秒执行一次
   */
  @Cron('*/30 * * * * *')
  async scanDeposits() {
    this.logger.log('开始扫描USDT充值...');

    try {
      // 获取所有有充值地址的钱包
      const wallets = await this.prisma.wallet.findMany({
        where: {
          depositAddress: { not: null },
        },
      });

      for (const wallet of wallets) {
        if (!wallet.depositAddress) continue;

        // 跳过无效地址（非真实TRON地址）
        if (!this.isValidTronAddress(wallet.depositAddress)) {
          this.logger.debug(`跳过无效地址: ${wallet.depositAddress}`);
          continue;
        }

        try {
          await this.checkAddressDeposit(wallet);
        } catch (error) {
          this.logger.error(`扫描地址 ${wallet.depositAddress} 失败:`, error);
        }
      }
    } catch (error) {
      this.logger.error('扫描充值失败:', error);
    }
  }

  /**
   * 验证TRON地址格式
   */
  private isValidTronAddress(address: string): boolean {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  }

  /**
   * 检查单个地址的USDT入账
   */
  private async checkAddressDeposit(wallet: any) {
    const address = wallet.depositAddress;

    // 查询该地址的USDT交易记录
    const url = `${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${USDT_CONTRACT_ADDRESS}`;

    const response = await fetch(url, {
      headers: {
        'TRON-PRO-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`TronGrid API错误: ${response.status}`);
    }

    const data = await response.json();
    const transactions = data.data || [];

    // 处理入账交易
    for (const tx of transactions) {
      // 只处理转入（to地址是用户充值地址）
      if (tx.to !== address) continue;

      // 检查是否已处理过此交易
      const existingTx = await this.prisma.transaction.findFirst({
        where: {
          description: `链上充值: ${tx.transaction_id}`,
        },
      });

      if (existingTx) {
        continue; // 已处理，跳过
      }

      // 入账金额（USDT有6位小数）
      const amount = parseFloat(tx.value) / 1e6;

      if (amount <= 0) continue;

      // 自动入账
      await this.processDeposit(wallet.userId, amount, tx.transaction_id);
    }
  }

  /**
   * 处理充值入账
   */
  private async processDeposit(userId: string, amount: number, txHash: string) {
    this.logger.log(`用户 ${userId} 充值 ${amount} USDT, tx: ${txHash}`);

    // 获取当前余额
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      this.logger.error(`用户钱包不存在: ${userId}`);
      return;
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    // 更新余额并记录交易
    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
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
          description: `链上充值: ${txHash}`,
        },
      });
    });

    this.logger.log(`✅ 用户 ${userId} 充值成功: ${amount} USDT`);
  }

  /**
   * 获取地址USDT余额
   */
  async getAddressBalance(address: string): Promise<number> {
    // 验证地址格式
    if (!this.isValidTronAddress(address)) {
      return 0;
    }

    try {
      const url = `${TRONGRID_API}/v1/accounts/${address}`;

      const response = await fetch(url, {
        headers: {
          'TRON-PRO-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        this.logger.warn(`获取余额失败: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      const trc20Balances = data.data?.[0]?.trc20_balance || [];

      // 查找USDT余额
      const usdtBalance = trc20Balances.find(
        (b: any) => b.token_id === USDT_CONTRACT_ADDRESS
      );

      if (!usdtBalance) return 0;

      return parseFloat(usdtBalance.balance) / 1e6;
    } catch (error) {
      this.logger.error(`获取地址余额错误: ${address}`, error);
      return 0;
    }
  }
}
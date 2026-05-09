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
      // 获取TRON网络
      const tronNetwork = await this.prisma.blockchainNetwork.findFirst({
        where: { name: 'TRON', isActive: true },
      });

      if (!tronNetwork) {
        this.logger.warn('TRON network not found');
        return;
      }

      // 获取所有有TRON充值地址的用户
      const walletAddresses = await this.prisma.walletAddress.findMany({
        where: { networkId: tronNetwork.id },
        include: { user: true },
      });

      for (const wa of walletAddresses) {
        if (!this.isValidTronAddress(wa.address)) {
          this.logger.debug(`跳过无效地址: ${wa.address}`);
          continue;
        }

        try {
          await this.checkAddressDeposit(wa.userId, wa.address);
        } catch (error) {
          this.logger.error(`扫描地址 ${wa.address} 失败:`, error);
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
  private async checkAddressDeposit(userId: string, address: string) {
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

    for (const tx of transactions) {
      if (tx.to !== address) continue;

      const existingTx = await this.prisma.transaction.findFirst({
        where: { txHash: tx.transaction_id },
      });

      if (existingTx) continue;

      const amount = parseFloat(tx.value) / 1e6;
      if (amount <= 0) continue;

      await this.processDeposit(userId, amount, tx.transaction_id);
    }
  }

  /**
   * 处理充值入账
   */
  private async processDeposit(userId: string, amount: number, txHash: string) {
    this.logger.log(`用户 ${userId} 充值 ${amount} USDT, tx: ${txHash}`);

    try {
      await this.walletsService.deposit(userId, amount, 'TRON', 'USDT', txHash);
      this.logger.log(`✅ 用户 ${userId} 充值成功: ${amount} USDT`);
    } catch (error) {
      this.logger.error(`充值入账失败:`, error);
    }
  }

  /**
   * 获取地址USDT余额
   */
  async getAddressBalance(address: string): Promise<number> {
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
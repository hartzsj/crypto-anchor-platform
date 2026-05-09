import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class DepositMonitorService {
  private readonly logger = new Logger(DepositMonitorService.name);
  private readonly tronApiKey: string;
  private readonly bscRpcUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private walletsService: WalletsService,
  ) {
    this.tronApiKey = this.configService.get('TRONGRID_API_KEY') || '';
    this.bscRpcUrl = this.configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org');
  }

  /**
   * 定时扫描所有链上的充值
   * 每30秒执行一次
   */
  @Cron('*/30 * * * * *')
  async scanAllDeposits() {
    this.logger.log('开始扫描多链充值...');

    // 获取所有激活的网络
    const networks = await this.prisma.blockchainNetwork.findMany({
      where: { isActive: true },
      include: { tokens: { where: { isActive: true } } },
    });

    for (const network of networks) {
      try {
        if (network.name === 'TRON') {
          await this.scanTronDeposits(network);
        } else if (network.name === 'BSC') {
          await this.scanBscDeposits(network);
        }
      } catch (error) {
        this.logger.error(`扫描 ${network.name} 充值失败:`, error);
      }
    }
  }

  /**
   * 扫描TRON链上的USDT充值
   */
  private async scanTronDeposits(network: any) {
    const usdtToken = network.tokens.find((t: any) => t.symbol === 'USDT');
    if (!usdtToken) return;

    // 获取所有TRON充值地址
    const walletAddresses = await this.prisma.walletAddress.findMany({
      where: { networkId: network.id },
      include: { user: { include: { wallet: true } } },
    });

    for (const wa of walletAddresses) {
      if (!this.isValidTronAddress(wa.address)) continue;

      try {
        await this.checkTronDeposit(wa, usdtToken);
      } catch (error) {
        this.logger.error(`扫描TRON地址 ${wa.address} 失败:`, error);
      }
    }
  }

  /**
   * 检查单个TRON地址的USDT入账
   */
  private async checkTronDeposit(walletAddress: any, token: any) {
    const address = walletAddress.address;
    const userId = walletAddress.userId;

    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${token.contractAddress}`;

    const response = await fetch(url, {
      headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
    });

    if (!response.ok) {
      throw new Error(`TronGrid API错误: ${response.status}`);
    }

    const data = await response.json();
    const transactions = data.data || [];

    for (const tx of transactions) {
      if (tx.to !== address) continue;

      // 检查是否已处理过此交易
      const existingTx = await this.prisma.transaction.findFirst({
        where: { txHash: tx.transaction_id },
      });

      if (existingTx) continue;

      const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
      if (amount <= 0) continue;

      await this.processDeposit(userId, amount, 'TRON', 'USDT', tx.transaction_id);
    }
  }

  /**
   * 扫描BSC链上的充值
   */
  private async scanBscDeposits(network: any) {
    // 获取所有BSC充值地址
    const walletAddresses = await this.prisma.walletAddress.findMany({
      where: { networkId: network.id },
      include: { user: { include: { wallet: true } } },
    });

    for (const wa of walletAddresses) {
      if (!this.isValidBscAddress(wa.address)) continue;

      for (const token of network.tokens) {
        try {
          await this.checkBscDeposit(wa, token, network);
        } catch (error) {
          this.logger.error(`扫描BSC地址 ${wa.address} ${token.symbol} 失败:`, error);
        }
      }
    }
  }

  /**
   * 检查BSC地址的代币入账
   */
  private async checkBscDeposit(walletAddress: any, token: any, network: any) {
    const address = walletAddress.address;
    const userId = walletAddress.userId;

    // 使用BSCscan API查询交易（需要API key）
    const bscApiKey = this.configService.get('BSCSCAN_API_KEY') || '';

    if (token.isNative) {
      // 查询BNB转账
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&page=1&offset=20&sort=desc&apikey=${bscApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        for (const tx of data.result) {
          if (tx.to.toLowerCase() !== address.toLowerCase()) continue;
          if (tx.value === '0') continue;

          const existingTx = await this.prisma.transaction.findFirst({
            where: { txHash: tx.hash },
          });

          if (existingTx) continue;

          const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
          if (amount <= 0) continue;

          await this.processDeposit(userId, amount, 'BSC', token.symbol, tx.hash);
        }
      }
    } else {
      // 查询BEP-20代币转账
      const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${token.contractAddress}&address=${address}&page=1&offset=20&sort=desc&apikey=${bscApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        for (const tx of data.result) {
          if (tx.to.toLowerCase() !== address.toLowerCase()) continue;

          const existingTx = await this.prisma.transaction.findFirst({
            where: { txHash: tx.hash },
          });

          if (existingTx) continue;

          const amount = parseFloat(tx.value) / Math.pow(10, token.decimals);
          if (amount <= 0) continue;

          await this.processDeposit(userId, amount, 'BSC', token.symbol, tx.hash);
        }
      }
    }
  }

  /**
   * 处理充值入账
   */
  private async processDeposit(
    userId: string,
    amount: number,
    networkName: string,
    tokenSymbol: string,
    txHash: string
  ) {
    this.logger.log(`用户 ${userId} 充值 ${amount} ${tokenSymbol} on ${networkName}, tx: ${txHash}`);

    try {
      await this.walletsService.deposit(userId, amount, networkName, tokenSymbol, txHash);
      this.logger.log(`✅ 用户 ${userId} 充值成功: ${amount} ${tokenSymbol}`);
    } catch (error) {
      this.logger.error(`充值入账失败:`, error);
    }
  }

  /**
   * 验证TRON地址格式
   */
  private isValidTronAddress(address: string): boolean {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  }

  /**
   * 验证BSC地址格式
   */
  private isValidBscAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * 获取指定链上地址的代币余额
   */
  async getAddressBalance(address: string, networkName: string, tokenSymbol: string): Promise<number> {
    if (networkName === 'TRON') {
      return this.getTronBalance(address, tokenSymbol);
    } else if (networkName === 'BSC') {
      return this.getBscBalance(address, tokenSymbol);
    }
    return 0;
  }

  private async getTronBalance(address: string, tokenSymbol: string): Promise<number> {
    if (!this.isValidTronAddress(address)) return 0;

    const token = await this.prisma.token.findFirst({
      where: {
        network: { name: 'TRON' },
        symbol: tokenSymbol,
      },
    });

    if (!token) return 0;

    try {
      if (token.isNative) {
        // TRX余额
        const url = `https://api.trongrid.io/v1/accounts/${address}`;
        const response = await fetch(url, {
          headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
        });
        const data = await response.json();
        const balance = data.data?.[0]?.balance || 0;
        return parseFloat(balance) / Math.pow(10, token.decimals);
      } else {
        // TRC-20余额
        const url = `https://api.trongrid.io/v1/accounts/${address}`;
        const response = await fetch(url, {
          headers: { 'TRON-PRO-API-KEY': this.tronApiKey },
        });
        const data = await response.json();
        const trc20Balances = data.data?.[0]?.trc20_balance || [];
        const tokenBalance = trc20Balances.find(
          (b: any) => b.token_id === token.contractAddress
        );
        if (!tokenBalance) return 0;
        return parseFloat(tokenBalance.balance) / Math.pow(10, token.decimals);
      }
    } catch (error) {
      this.logger.error(`获取TRON余额错误:`, error);
      return 0;
    }
  }

  private async getBscBalance(address: string, tokenSymbol: string): Promise<number> {
    if (!this.isValidBscAddress(address)) return 0;

    const token = await this.prisma.token.findFirst({
      where: {
        network: { name: 'BSC' },
        symbol: tokenSymbol,
      },
    });

    if (!token) return 0;

    const bscApiKey = this.configService.get('BSCSCAN_API_KEY') || '';

    try {
      if (token.isNative) {
        // BNB余额
        const url = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${bscApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === '1') {
          return parseFloat(data.result) / Math.pow(10, token.decimals);
        }
      } else {
        // BEP-20余额
        const url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${token.contractAddress}&address=${address}&tag=latest&apikey=${bscApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === '1') {
          return parseFloat(data.result) / Math.pow(10, token.decimals);
        }
      }
    } catch (error) {
      this.logger.error(`获取BSC余额错误:`, error);
    }
    return 0;
  }
}
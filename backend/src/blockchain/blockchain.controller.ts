import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlockchainService } from './blockchain.service';
import { DepositMonitorService } from './deposit-monitor.service';
import { BlockchainType } from './blockchain.interface';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly depositMonitor: DepositMonitorService,
  ) {}

  /**
   * 获取支持的网络列表
   */
  @Get('networks')
  async getNetworks() {
    return this.blockchainService.getSupportedNetworks();
  }

  /**
   * 获取指定网络的代币列表
   */
  @Get('networks/:network/tokens')
  async getTokens(@Param('network') network: string) {
    const networks = await this.blockchainService.getSupportedNetworks();
    const net = networks.find((n) => n.name === network);
    return net?.tokens || [];
  }

  /**
   * 获取链上余额
   */
  @Get('balance')
  async getBalance(
    @Query('address') address: string,
    @Query('network') network: string,
    @Query('token') token: string
  ) {
    const networkType = network.toUpperCase() as BlockchainType;
    return {
      balance: await this.blockchainService.getOnchainBalance(address, networkType, token),
    };
  }

  /**
   * 验证地址
   */
  @Post('validate-address')
  async validateAddress(@Body() body: { address: string; network: string }) {
    const networkType = body.network.toUpperCase() as BlockchainType;
    return {
      valid: this.blockchainService.isValidAddress(body.address, networkType),
    };
  }

  /**
   * 获取用户钱包地址
   */
  @UseGuards(JwtAuthGuard)
  @Get('wallet-address/:network')
  async getWalletAddress(@Request() req: any, @Param('network') network: string) {
    const userId = req.user.userId;
    const address = await this.blockchainService.getWalletAddress(userId, network.toUpperCase());
    return { address };
  }

  /**
   * 设置用户钱包地址
   */
  @UseGuards(JwtAuthGuard)
  @Post('wallet-address')
  async setWalletAddress(
    @Request() req: any,
    @Body() body: { network: string; address: string }
  ) {
    const userId = req.user.userId;

    try {
      await this.blockchainService.setWalletAddress(userId, body.network.toUpperCase(), body.address);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 创建链上托管订单
   */
  @UseGuards(JwtAuthGuard)
  @Post('escrow/create')
  async createEscrow(
    @Request() req: any,
    @Body()
    body: {
      orderId: string;
      network: string;
      buyerAddress: string;
      sellerAddress: string;
      amount: string;
      token: string;
    }
  ) {
    try {
      const result = await this.blockchainService.createOnchainEscrow(
        body.orderId,
        body.network.toUpperCase() as BlockchainType,
        body.buyerAddress,
        body.sellerAddress,
        body.amount,
        body.token,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 充值托管订单
   */
  @UseGuards(JwtAuthGuard)
  @Post('escrow/fund')
  async fundEscrow(
    @Request() req: any,
    @Body() body: { orderId: string; network: string; amount: string; token: string }
  ) {
    const userId = req.user.userId;
    const buyerAddress = await this.blockchainService.getWalletAddress(userId, body.network.toUpperCase());

    if (!buyerAddress) {
      throw new BadRequestException('请先设置钱包地址');
    }

    try {
      const result = await this.blockchainService.fundOnchainEscrow(
        body.orderId,
        body.network.toUpperCase() as BlockchainType,
        buyerAddress,
        body.amount,
        body.token,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 查询托管订单状态
   */
  @Get('escrow/status')
  async getEscrowStatus(@Query('orderId') orderId: string, @Query('network') network: string) {
    return this.blockchainService.getOnchainEscrowStatus(orderId, network.toUpperCase() as BlockchainType);
  }

  /**
   * 获取用户链上地址余额（用于前端显示）
   */
  @UseGuards(JwtAuthGuard)
  @Get('deposit-balance/:network')
  async getDepositBalance(@Request() req: any, @Param('network') network: string) {
    const userId = req.user.userId;
    const networkUpper = network.toUpperCase();

    const address = await this.blockchainService.getWalletAddress(userId, networkUpper);

    if (!address) {
      return { balances: {}, address: null };
    }

    const networks = await this.blockchainService.getSupportedNetworks();
    const net = networks.find((n) => n.name === networkUpper);

    if (!net) {
      return { balances: {}, address };
    }

    const balances: Record<string, number> = {};

    for (const token of net.tokens) {
      const balance = await this.depositMonitor.getAddressBalance(address, networkUpper, token.symbol);
      balances[token.symbol] = balance;
    }

    return { balances, address };
  }
}
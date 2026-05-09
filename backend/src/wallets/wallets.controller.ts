import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.walletsService.getBalance(req.user.userId);
  }

  @Post('deposit')
  async deposit(
    @Request() req,
    @Body() body: { amount: number; network?: string; token?: string; description?: string }
  ) {
    const network = body.network || 'TRON';
    const token = body.token || 'USDT';
    return this.walletsService.deposit(
      req.user.userId,
      body.amount,
      network,
      token,
      undefined,
      body.description,
    );
  }

  @Post('withdraw')
  async withdraw(
    @Request() req,
    @Body() body: { amount: number; address: string; network?: string; token?: string }
  ) {
    const network = body.network || 'TRON';
    const token = body.token || 'USDT';
    return this.walletsService.withdraw(
      req.user.userId,
      body.amount,
      body.address,
      network,
      token,
    );
  }

  @Get('transactions')
  async getTransactions(@Request() req, @Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNum = parseInt(skip || '0', 10);
    const takeNum = parseInt(take || '20', 10);
    return this.walletsService.getTransactions(req.user.userId, skipNum, takeNum);
  }

  @Get('token-balance')
  async getTokenBalance(
    @Request() req,
    @Query('network') network: string,
    @Query('token') token: string
  ) {
    return this.walletsService.getTokenBalance(req.user.userId, network, token);
  }
}
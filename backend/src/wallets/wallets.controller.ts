import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.walletsService.getBalance(req.user.id);
  }

  @Post('deposit')
  async deposit(@Request() req, @Body() body: DepositDto) {
    return this.walletsService.deposit(req.user.id, body.amount, body.description);
  }

  @Post('withdraw')
  async withdraw(@Request() req, @Body() body: WithdrawDto) {
    return this.walletsService.withdraw(req.user.id, body.amount, body.address);
  }

  @Get('transactions')
  async getTransactions(@Request() req) {
    return this.walletsService.getTransactions(req.user.id);
  }
}

import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TronAddressService } from './tron-address.service';
import { TronMonitorService } from './tron-monitor.service';
import { SetDepositAddressDto } from './dto/set-deposit-address.dto';

@Controller('tron')
@UseGuards(JwtAuthGuard)
export class TronController {
  constructor(
    private tronAddressService: TronAddressService,
    private tronMonitorService: TronMonitorService,
  ) {}

  /**
   * 获取用户充值地址
   */
  @Get('deposit-address')
  async getDepositAddress(@Request() req) {
    const address = await this.tronAddressService.getDepositAddress(req.user.userId);
    return { address };
  }

  /**
   * 设置充值地址（用户手动提供）
   */
  @Post('deposit-address')
  async setDepositAddress(@Request() req, @Body() body: SetDepositAddressDto) {
    await this.tronAddressService.setDepositAddress(req.user.userId, body.address);
    return { success: true, address: body.address };
  }

  /**
   * 查询充值地址USDT余额
   */
  @Get('deposit-balance')
  async getDepositBalance(@Request() req) {
    const address = await this.tronAddressService.getDepositAddress(req.user.userId);

    if (!address) {
      return { balance: 0, address: null };
    }

    const balance = await this.tronMonitorService.getAddressBalance(address);
    return { balance, address };
  }
}
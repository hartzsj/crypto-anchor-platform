import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { DisputeOrderDto } from './dto/dispute-order.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // 创建订单 - 每分钟最多10次
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createOrder(@Request() req, @Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, body.itemId);
  }

  // 支付订单 - 每分钟最多5次（防止重复支付）
  @Post(':id/pay')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async payOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.payOrder(id, req.user.id);
  }

  // 发货 - 每分钟最多10次
  @Post(':id/ship')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async shipOrder(
    @Param('id') id: string,
    @Request() req,
    @Body() body: ShipOrderDto,
  ) {
    return this.ordersService.shipOrder(id, req.user.id, body.logisticsCompany, body.trackingNumber);
  }

  // 确认收货 - 每分钟最多5次（防止误操作）
  @Post(':id/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async confirmReceipt(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmReceipt(id, req.user.id);
  }

  // 取消订单 - 每分钟最多5次
  @Post(':id/cancel')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async cancelOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  // 发起争议 - 每分钟最多3次（防止滥用）
  @Post(':id/dispute')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async disputeOrder(@Param('id') id: string, @Request() req, @Body() body: DisputeOrderDto) {
    return this.ordersService.disputeOrder(id, req.user.id, body.reason);
  }

  // 管理员仲裁争议订单 - 每分钟最多10次
  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async resolveDispute(
    @Param('id') id: string,
    @Request() req,
    @Body() body: ResolveDisputeDto,
  ) {
    return this.ordersService.resolveDispute(id, req.user.id, body.refund);
  }

  // 获取我的购买订单
  @Get('my/buy')
  async getMyBuyOrders(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.ordersService.getMyBuyOrders(req.user.id, skip || 0, take || 20);
  }

  // 获取我的销售订单
  @Get('my/sell')
  async getMySellOrders(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.ordersService.getMySellOrders(req.user.id, skip || 0, take || 20);
  }

  // 获取订单详情
  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOne(id, req.user.id);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  /**
   * 获取多个代币的实时价格
   * GET /market/prices?symbols=BTC,ETH,USDT
   */
  @Get('prices')
  async getPrices(@Query('symbols') symbols?: string) {
    const symbolList = symbols?.split(',').map((s) => s.trim().toUpperCase()) || ['BTC', 'ETH', 'USDT', 'BNB', 'TRX'];
    return this.marketService.getPrices(symbolList);
  }

  /**
   * 获取单个代币的历史价格
   * GET /market/history?symbol=BTC&days=30
   */
  @Get('history')
  async getHistory(@Query('symbol') symbol: string, @Query('days') days?: string) {
    const dayCount = parseInt(days || '30', 10);
    return this.marketService.getHistory(symbol.toUpperCase(), dayCount);
  }

  /**
   * 获取K线数据
   * GET /market/klines?symbol=BTC&interval=1d&limit=100
   */
  @Get('klines')
  async getKlines(
    @Query('symbol') symbol: string,
    @Query('interval') interval?: string,
    @Query('limit') limit?: string
  ) {
    const intervalValue = interval || '1d';
    const limitValue = parseInt(limit || '100', 10);
    return this.marketService.getKlines(symbol.toUpperCase(), intervalValue, limitValue);
  }

  /**
   * 获取所有代币价格
   * GET /market/all
   */
  @Get('all')
  async getAllPrices() {
    return this.marketService.getAllPrices();
  }
}
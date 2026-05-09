import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// CoinGecko API IDs mapping
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  TRX: 'tron',
};

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly coingeckoApiKey: string;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private historyCache: Map<string, { data: any[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 1分钟缓存

  constructor(private configService: ConfigService) {
    this.coingeckoApiKey = this.configService.get('COINGECKO_API_KEY') || '';
  }

  /**
   * 获取多个代币的实时价格
   */
  async getPrices(symbols: string[]): Promise<Record<string, { price: number; change24h: number }>> {
    const result: Record<string, { price: number; change24h: number }> = {};

    // 检查缓存
    const now = Date.now();
    const needsRefresh: string[] = [];

    for (const symbol of symbols) {
      const cached = this.priceCache.get(symbol);
      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        result[symbol] = { price: cached.price, change24h: 0 };
      } else {
        needsRefresh.push(symbol);
      }
    }

    // 需要刷新的代币
    if (needsRefresh.length > 0) {
      const ids = needsRefresh
        .map((s) => COINGECKO_IDS[s.toUpperCase()])
        .filter(Boolean)
        .join(',');

      if (ids) {
        try {
          const prices = await this.fetchCoinGeckoPrices(ids);
          for (const symbol of needsRefresh) {
            const id = COINGECKO_IDS[symbol.toUpperCase()];
            if (id && prices[id]) {
              result[symbol] = prices[id];
              this.priceCache.set(symbol, { price: prices[id].price, timestamp: now });
            }
          }
        } catch (error) {
          this.logger.error('获取价格失败:', error);
          // 使用缓存中的旧数据（即使过期）
          for (const symbol of needsRefresh) {
            const cached = this.priceCache.get(symbol);
            if (cached) {
              result[symbol] = { price: cached.price, change24h: 0 };
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * 获取单个代币的历史价格数据
   */
  async getHistory(symbol: string, days: number): Promise<{ date: string; price: number }[]> {
    const id = COINGECKO_IDS[symbol.toUpperCase()];
    if (!id) return [];

    const cacheKey = `${symbol}-${days}`;
    const now = Date.now();
    const cached = this.historyCache.get(cacheKey);

    // 历史数据缓存时间更长（5分钟）
    if (cached && now - cached.timestamp < 5 * this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await this.fetchCoinGeckoHistory(id, days);
      this.historyCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      this.logger.error(`获取 ${symbol} 历史数据失败:`, error);
      if (cached) return cached.data;
      return [];
    }
  }

  /**
   * 获取K线数据（简化版，从历史数据转换）
   */
  async getKlines(symbol: string, interval: string, limit: number): Promise<any[]> {
    // CoinGecko免费API不支持真正的K线，我们用历史数据模拟
    const daysMap: Record<string, number> = {
      '1m': 1,
      '5m': 1,
      '15m': 1,
      '1h': 1,
      '4h': 7,
      '1d': limit > 30 ? limit : 30,
    };

    const days = daysMap[interval] || 30;
    const history = await this.getHistory(symbol, days);

    // 从历史数据生成简化K线
    const klines: any[] = [];
    for (let i = 0; i < Math.min(history.length, limit); i++) {
      const h = history[i];
      klines.push({
        time: h.date,
        open: h.price,
        high: h.price * 1.001,
        low: h.price * 0.999,
        close: h.price,
        volume: 0,
      });
    }

    return klines;
  }

  /**
   * 从CoinGecko获取价格
   */
  private async fetchCoinGeckoPrices(ids: string): Promise<Record<string, { price: number; change24h: number }>> {
    const baseUrl = this.coingeckoApiKey
      ? 'https://api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const headers: Record<string, string> = {};
    if (this.coingeckoApiKey) {
      headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('CoinGecko API rate limit exceeded');
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const result: Record<string, { price: number; change24h: number }> = {};

    for (const [id, prices] of Object.entries(data)) {
      const p = prices as any;
      result[id] = {
        price: p.usd || 0,
        change24h: p.usd_24h_change || 0,
      };
    }

    return result;
  }

  /**
   * 从CoinGecko获取历史数据
   */
  private async fetchCoinGeckoHistory(id: string, days: number): Promise<{ date: string; price: number }[]> {
    const baseUrl = this.coingeckoApiKey
      ? 'https://api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;

    const headers: Record<string, string> = {};
    if (this.coingeckoApiKey) {
      headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const prices = data.prices || [];

    return prices.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      price,
    }));
  }

  /**
   * 批量获取所有支持代币的价格
   */
  async getAllPrices(): Promise<Record<string, { price: number; change24h: number }>> {
    const symbols = Object.keys(COINGECKO_IDS);
    return this.getPrices(symbols);
  }
}
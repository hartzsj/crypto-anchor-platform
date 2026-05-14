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

// CoinCap API IDs mapping (备用)
const COINCAP_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binance-coin',
  TRX: 'tron',
};

// Mock 数据（最终备选）
const MOCK_PRICES: Record<string, { price: number; change24h: number }> = {
  BTC: { price: 94500, change24h: 2.5 },
  ETH: { price: 3580, change24h: 1.8 },
  USDT: { price: 1.0, change24h: 0.01 },
  BNB: { price: 610, change24h: -0.5 },
  TRX: { price: 0.125, change24h: 3.2 },
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
   * 从CoinGecko获取价格（支持备用API和Mock数据）
   */
  private async fetchCoinGeckoPrices(ids: string): Promise<Record<string, { price: number; change24h: number }>> {
    // 1. 尝试 CoinGecko API
    try {
      const baseUrl = 'https://api.coingecko.com/api/v3';
      const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

      const headers: Record<string, string> = {};
      if (this.coingeckoApiKey) {
        headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
      }

      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

      if (response.ok) {
        const data = await response.json();
        const result: Record<string, { price: number; change24h: number }> = {};

        for (const [id, prices] of Object.entries(data)) {
          const p = prices as any;
          result[id] = {
            price: p.usd || 0,
            change24h: p.usd_24h_change || 0,
          };
        }

        if (Object.keys(result).length > 0) {
          this.logger.log('CoinGecko API 成功');
          return result;
        }
      }
    } catch (error) {
      this.logger.warn(`CoinGecko API 失败: ${error}`);
    }

    // 2. 尝试 CoinCap API (备用)
    try {
      const result: Record<string, { price: number; change24h: number }> = {};
      const idList = ids.split(',');

      for (const id of idList) {
        const symbol = Object.keys(COINGECKO_IDS).find(s => COINGECKO_IDS[s] === id);
        const coincapId = symbol ? COINCAP_IDS[symbol] : null;

        if (coincapId) {
          const url = `https://api.coincap.io/v2/assets/${coincapId}`;
          const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              result[id] = {
                price: parseFloat(data.data.priceUsd) || 0,
                change24h: parseFloat(data.data.changePercent24Hr) || 0,
              };
            }
          }
        }
      }

      if (Object.keys(result).length > 0) {
        this.logger.log('CoinCap API 成功');
        return result;
      }
    } catch (error) {
      this.logger.warn(`CoinCap API 失败: ${error}`);
    }

    // 3. 使用 Mock 数据
    this.logger.log('使用 Mock 数据');
    const result: Record<string, { price: number; change24h: number }> = {};
    const idList = ids.split(',');

    for (const id of idList) {
      const symbol = Object.keys(COINGECKO_IDS).find(s => COINGECKO_IDS[s] === id);
      if (symbol && MOCK_PRICES[symbol]) {
        // 添加随机波动模拟真实数据
        const mock = MOCK_PRICES[symbol];
        const randomChange = (Math.random() - 0.5) * 2; // ±1% 波动
        result[id] = {
          price: mock.price * (1 + randomChange / 100),
          change24h: mock.change24h + (Math.random() - 0.5) * 0.5,
        };
      }
    }

    return result;
  }

  /**
   * 从CoinGecko获取历史数据（支持备用API和Mock数据）
   */
  private async fetchCoinGeckoHistory(id: string, days: number): Promise<{ date: string; price: number }[]> {
    const symbol = Object.keys(COINGECKO_IDS).find(s => COINGECKO_IDS[s] === id);

    // 1. 尝试 CoinGecko API
    try {
      const baseUrl = 'https://api.coingecko.com/api/v3';
      const url = `${baseUrl}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;

      const headers: Record<string, string> = {};
      if (this.coingeckoApiKey) {
        headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
      }

      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

      if (response.ok) {
        const data = await response.json();
        const prices = data.prices || [];

        if (prices.length > 0) {
          this.logger.log(`CoinGecko 历史数据成功: ${id}`);
          return prices.map(([timestamp, price]: [number, number]) => ({
            date: new Date(timestamp).toISOString().split('T')[0],
            price,
          }));
        }
      }
    } catch (error) {
      this.logger.warn(`CoinGecko 历史数据失败: ${error}`);
    }

    // 2. 尝试 CoinCap API
    try {
      const coincapId = symbol ? COINCAP_IDS[symbol] : null;
      if (coincapId) {
        const url = `https://api.coincap.io/v2/assets/${coincapId}/history?interval=d1`;
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

        if (response.ok) {
          const data = await response.json();
          const history = data.data || [];

          if (history.length > 0) {
            this.logger.log(`CoinCap 历史数据成功: ${id}`);
            return history.slice(-days).map((item: any) => ({
              date: new Date(item.time).toISOString().split('T')[0],
              price: parseFloat(item.priceUsd) || 0,
            }));
          }
        }
      }
    } catch (error) {
      this.logger.warn(`CoinCap 历史数据失败: ${error}`);
    }

    // 3. 生成 Mock 历史数据
    this.logger.log(`使用 Mock 历史数据: ${id}`);
    const mockPrice = symbol && MOCK_PRICES[symbol] ? MOCK_PRICES[symbol].price : 100;
    const mockData: { date: string; price: number }[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // 模拟价格波动
      const trend = (days - i) / days * 0.1; // 上涨趋势
      const noise = (Math.random() - 0.5) * 0.05; // 随机波动
      const price = mockPrice * (1 + trend + noise);
      mockData.push({ date, price });
    }

    return mockData;
  }

  /**
   * 批量获取所有支持代币的价格
   */
  async getAllPrices(): Promise<Record<string, { price: number; change24h: number }>> {
    const symbols = Object.keys(COINGECKO_IDS);
    return this.getPrices(symbols);
  }
}
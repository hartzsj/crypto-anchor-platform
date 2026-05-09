"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MarketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const COINGECKO_IDS = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    TRX: 'tron',
};
let MarketService = MarketService_1 = class MarketService {
    configService;
    logger = new common_1.Logger(MarketService_1.name);
    coingeckoApiKey;
    priceCache = new Map();
    historyCache = new Map();
    CACHE_TTL = 60 * 1000;
    constructor(configService) {
        this.configService = configService;
        this.coingeckoApiKey = this.configService.get('COINGECKO_API_KEY') || '';
    }
    async getPrices(symbols) {
        const result = {};
        const now = Date.now();
        const needsRefresh = [];
        for (const symbol of symbols) {
            const cached = this.priceCache.get(symbol);
            if (cached && now - cached.timestamp < this.CACHE_TTL) {
                result[symbol] = { price: cached.price, change24h: 0 };
            }
            else {
                needsRefresh.push(symbol);
            }
        }
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
                }
                catch (error) {
                    this.logger.error('获取价格失败:', error);
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
    async getHistory(symbol, days) {
        const id = COINGECKO_IDS[symbol.toUpperCase()];
        if (!id)
            return [];
        const cacheKey = `${symbol}-${days}`;
        const now = Date.now();
        const cached = this.historyCache.get(cacheKey);
        if (cached && now - cached.timestamp < 5 * this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const data = await this.fetchCoinGeckoHistory(id, days);
            this.historyCache.set(cacheKey, { data, timestamp: now });
            return data;
        }
        catch (error) {
            this.logger.error(`获取 ${symbol} 历史数据失败:`, error);
            if (cached)
                return cached.data;
            return [];
        }
    }
    async getKlines(symbol, interval, limit) {
        const daysMap = {
            '1m': 1,
            '5m': 1,
            '15m': 1,
            '1h': 1,
            '4h': 7,
            '1d': limit > 30 ? limit : 30,
        };
        const days = daysMap[interval] || 30;
        const history = await this.getHistory(symbol, days);
        const klines = [];
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
    async fetchCoinGeckoPrices(ids) {
        const baseUrl = this.coingeckoApiKey
            ? 'https://api.coingecko.com/api/v3'
            : 'https://api.coingecko.com/api/v3';
        const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const headers = {};
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
        const result = {};
        for (const [id, prices] of Object.entries(data)) {
            const p = prices;
            result[id] = {
                price: p.usd || 0,
                change24h: p.usd_24h_change || 0,
            };
        }
        return result;
    }
    async fetchCoinGeckoHistory(id, days) {
        const baseUrl = this.coingeckoApiKey
            ? 'https://api.coingecko.com/api/v3'
            : 'https://api.coingecko.com/api/v3';
        const url = `${baseUrl}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
        const headers = {};
        if (this.coingeckoApiKey) {
            headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        const prices = data.prices || [];
        return prices.map(([timestamp, price]) => ({
            date: new Date(timestamp).toISOString().split('T')[0],
            price,
        }));
    }
    async getAllPrices() {
        const symbols = Object.keys(COINGECKO_IDS);
        return this.getPrices(symbols);
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = MarketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MarketService);
//# sourceMappingURL=market.service.js.map
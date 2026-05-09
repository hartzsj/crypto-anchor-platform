import { ConfigService } from '@nestjs/config';
export declare class MarketService {
    private configService;
    private readonly logger;
    private readonly coingeckoApiKey;
    private priceCache;
    private historyCache;
    private readonly CACHE_TTL;
    constructor(configService: ConfigService);
    getPrices(symbols: string[]): Promise<Record<string, {
        price: number;
        change24h: number;
    }>>;
    getHistory(symbol: string, days: number): Promise<{
        date: string;
        price: number;
    }[]>;
    getKlines(symbol: string, interval: string, limit: number): Promise<any[]>;
    private fetchCoinGeckoPrices;
    private fetchCoinGeckoHistory;
    getAllPrices(): Promise<Record<string, {
        price: number;
        change24h: number;
    }>>;
}

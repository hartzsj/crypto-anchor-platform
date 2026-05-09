import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    getPrices(symbols?: string): Promise<Record<string, {
        price: number;
        change24h: number;
    }>>;
    getHistory(symbol: string, days?: string): Promise<{
        date: string;
        price: number;
    }[]>;
    getKlines(symbol: string, interval?: string, limit?: string): Promise<any[]>;
    getAllPrices(): Promise<Record<string, {
        price: number;
        change24h: number;
    }>>;
}

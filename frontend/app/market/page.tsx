'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { marketApi } from '@/lib/api';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, AreaData } from 'lightweight-charts';

interface PriceInfo {
  price: number;
  change24h: number;
}

interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HistoryData {
  time: string;
  price: number;
}

const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
  { symbol: 'TRX', name: 'TRON', color: '#EF0027' },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
];

const INTERVALS = [
  { value: '1d', label: '日线' },
  { value: '1h', label: '小时线' },
  { value: '1w', label: '周线' },
];

export default function MarketPage() {
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  const klineChartContainerRef = useRef<HTMLDivElement>(null);
  const historyChartContainerRef = useRef<HTMLDivElement>(null);
  const klineChartRef = useRef<IChartApi | null>(null);
  const historyChartRef = useRef<IChartApi | null>(null);
  const klineSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const historySeriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  // 加载价格数据
  const loadPrices = async () => {
    try {
      const res = await marketApi.getPrices(TOKENS.map(t => t.symbol));
      setPrices(res.data || {});
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  };

  // 加载K线数据
  const loadKlineData = async () => {
    setLoading(true);
    try {
      const res = await marketApi.getKlines(selectedToken, selectedInterval, 100);
      const data = res.data || [];

      // 转换数据格式
      const formattedData = data.map((item: any) => ({
        time: item.time || item.timestamp,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }));

      setKlineData(formattedData);
    } catch (error) {
      console.error('Failed to load kline data:', error);
      setKlineData([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载历史价格数据
  const loadHistoryData = async () => {
    try {
      const res = await marketApi.getHistory(selectedToken, 30);
      const data = res.data || [];

      // 转换数据格式
      const formattedData = data.map((item: any) => ({
        time: item.time || item.timestamp,
        price: Number(item.price),
      }));

      setHistoryData(formattedData);
    } catch (error) {
      console.error('Failed to load history data:', error);
      setHistoryData([]);
    }
  };

  // 初始化K线图表
  const initKlineChart = useCallback(() => {
    if (!klineChartContainerRef.current) return;

    // 清除旧图表
    if (klineChartRef.current) {
      klineChartRef.current.remove();
      klineChartRef.current = null;
      klineSeriesRef.current = null;
    }

    const chart = createChart(klineChartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-muted)',
      },
      grid: {
        vertLines: { color: 'var(--border-subtle)' },
        horzLines: { color: 'var(--border-subtle)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'var(--border)',
      },
      timeScale: {
        borderColor: 'var(--border)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: klineChartContainerRef.current.clientWidth,
      height: 300,
    });

    klineChartRef.current = chart;

    const tokenInfo = TOKENS.find(t => t.symbol === selectedToken);

    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      klineSeriesRef.current = candlestickSeries;

      if (klineData.length > 0) {
        candlestickSeries.setData(klineData as CandlestickData[]);
      }
    } else {
      const lineSeries = chart.addLineSeries({
        color: tokenInfo?.color || '#2962FF',
        lineWidth: 2,
      });
      klineSeriesRef.current = lineSeries;

      if (klineData.length > 0) {
        const lineData = klineData.map(d => ({ time: d.time, value: d.close }));
        lineSeries.setData(lineData as LineData[]);
      }
    }

    chart.timeScale().fitContent();
  }, [klineData, selectedToken, chartType]);

  // 初始化历史价格图表
  const initHistoryChart = useCallback(() => {
    if (!historyChartContainerRef.current) return;

    // 清除旧图表
    if (historyChartRef.current) {
      historyChartRef.current.remove();
      historyChartRef.current = null;
      historySeriesRef.current = null;
    }

    const chart = createChart(historyChartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-muted)',
      },
      grid: {
        vertLines: { color: 'var(--border-subtle)' },
        horzLines: { color: 'var(--border-subtle)' },
      },
      rightPriceScale: {
        borderColor: 'var(--border)',
      },
      timeScale: {
        borderColor: 'var(--border)',
      },
      width: historyChartContainerRef.current.clientWidth,
      height: 200,
    });

    historyChartRef.current = chart;

    const tokenInfo = TOKENS.find(t => t.symbol === selectedToken);
    const areaSeries = chart.addAreaSeries({
      topColor: `${tokenInfo?.color}40` || 'rgba(41, 98, 255, 0.4)',
      bottomColor: `${tokenInfo?.color}10` || 'rgba(41, 98, 255, 0.1)',
      lineColor: tokenInfo?.color || '#2962FF',
      lineWidth: 2,
    });

    historySeriesRef.current = areaSeries;

    if (historyData.length > 0) {
      const areaData = historyData.map(d => ({ time: d.time, value: d.price }));
      areaSeries.setData(areaData as AreaData[]);
    }

    chart.timeScale().fitContent();
  }, [historyData, selectedToken]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (klineChartRef.current && klineChartContainerRef.current) {
        klineChartRef.current.applyOptions({
          width: klineChartContainerRef.current.clientWidth,
        });
      }
      if (historyChartRef.current && historyChartContainerRef.current) {
        historyChartRef.current.applyOptions({
          width: historyChartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化加载
  useEffect(() => {
    loadPrices();
    loadKlineData();
    loadHistoryData();
  }, []);

  // 代币或间隔变化时重新加载
  useEffect(() => {
    loadKlineData();
    loadHistoryData();
  }, [selectedToken, selectedInterval]);

  // K线数据变化时更新图表
  useEffect(() => {
    if (klineData.length > 0) {
      initKlineChart();
    }
  }, [klineData, initKlineChart]);

  // 历史数据变化时更新图表
  useEffect(() => {
    if (historyData.length > 0) {
      initHistoryChart();
    }
  }, [historyData, initHistoryChart]);

  // 自动刷新价格
  useEffect(() => {
    const interval = setInterval(loadPrices, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            行情中心
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">实时价格、K线图表、历史走势</p>
        </div>

        {/* Price Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {TOKENS.map((token) => {
            const priceInfo = prices[token.symbol];
            const isSelected = selectedToken === token.symbol;
            const changePositive = priceInfo?.change24h >= 0;

            return (
              <button
                key={token.symbol}
                onClick={() => setSelectedToken(token.symbol)}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[var(--surface)] border-[var(--accent)] shadow-[var(--shadow-md)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: token.color }}
                  >
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{token.symbol}</p>
                    <p className="text-xs text-[var(--text-muted)]">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-[var(--text)]">
                    ${priceInfo?.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '--'}
                  </p>
                  <p className={`text-sm font-medium ${changePositive ? 'text-green-600' : 'text-red-600'}`}>
                    {changePositive ? '+' : ''}{priceInfo?.change24h?.toFixed(2) || '--'}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chart Controls */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Interval Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">时间间隔:</span>
              <div className="flex gap-2">
                {INTERVALS.map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => setSelectedInterval(interval.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedInterval === interval.value
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--canvas)] text-[var(--text)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">图表类型:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('candlestick')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    chartType === 'candlestick'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--canvas)] text-[var(--text)] hover:bg-[var(--border)]'
                  }`}
                >
                  K线
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    chartType === 'line'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--canvas)] text-[var(--text)] hover:bg-[var(--border)]'
                  }`}
                >
                  折线
                </button>
              </div>
            </div>

            {/* Selected Token Info */}
            <div className="flex-1 text-right">
              <span className="text-lg font-bold text-[var(--text)]">{selectedToken}</span>
              <span className="ml-2 text-sm text-[var(--text-muted)]">
                ${prices[selectedToken]?.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* K-line Chart */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
            {chartType === 'candlestick' ? 'K线图表' : '价格走势'}
          </h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="skeleton w-full h-full rounded-xl" />
            </div>
          ) : klineData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-[var(--text-muted)]">暂无数据</p>
            </div>
          ) : (
            <div ref={klineChartContainerRef} className="w-full h-[300px]" />
          )}
        </div>

        {/* History Price Chart */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">30天历史走势</h2>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="skeleton w-full h-full rounded-xl" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[var(--text-muted)]">暂无数据</p>
            </div>
          ) : (
            <div ref={historyChartContainerRef} className="w-full h-[200px]" />
          )}
        </div>

        {/* Price Stats Table */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">价格统计</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">代币</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">当前价格</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">24h涨跌</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">价格(USDT)</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map((token) => {
                  const priceInfo = prices[token.symbol];
                  const changePositive = priceInfo?.change24h >= 0;
                  const usdtPrice = token.symbol === 'USDT'
                    ? 1
                    : priceInfo?.price
                      ? priceInfo.price / (prices['USDT']?.price || 1)
                      : null;

                  return (
                    <tr
                      key={token.symbol}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: token.color }}
                          >
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text)]">{token.symbol}</p>
                            <p className="text-xs text-[var(--text-muted)]">{token.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-mono font-semibold text-[var(--text)]">
                        ${priceInfo?.price?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || '--'}
                      </td>
                      <td className={`text-right py-3 px-4 font-mono font-medium ${changePositive ? 'text-green-600' : 'text-red-600'}`}>
                        {changePositive ? '+' : ''}{priceInfo?.change24h?.toFixed(2) || '--'}%
                      </td>
                      <td className="text-right py-3 px-4 font-mono text-[var(--accent)]">
                        {usdtPrice?.toFixed(4) || '--'} USDT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-[var(--text-subtle)]">
          数据来源: CoinGecko API · 每30秒自动刷新价格
        </div>
      </div>
    </div>
  );
}
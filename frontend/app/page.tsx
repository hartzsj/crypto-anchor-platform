'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { itemsApi, marketApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  location: string;
  seller: {
    id: string;
    username: string;
    nickname: string;
    reputation: number;
  };
  createdAt: string;
}

interface PriceInfo {
  price: number;
  change24h: number;
}

const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
  { symbol: 'TRX', name: 'TRON', color: '#EF0027' },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
];

// SVG Icons
const WalletIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--accent)" strokeWidth="1.5">
    <rect x="4" y="8" width="40" height="32" rx="4" />
    <path d="M4 16h40M32 28h8M36 24v8" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--accent)" strokeWidth="1.5">
    <path d="M24 4L6 12v12c0 14 10 22 18 26 8-4 18-12 18-26V12L24 4z" />
    <path d="M18 24l4 4 8-8" />
  </svg>
);

const StarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--accent)" strokeWidth="1.5">
    <path d="M24 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L4 18l14-2 6-12z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 10h12M12 6l4 4-4 4" />
  </svg>
);

const PackageIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1">
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40M20 8l12 8 12-8" />
  </svg>
);

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadItems();
    loadPrices();
  }, []);

  const loadItems = async () => {
    try {
      const response = await itemsApi.getAll({ take: 8 });
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrices = async () => {
    try {
      const response = await marketApi.getPrices(TOKENS.map(t => t.symbol));
      setPrices(response.data || {});
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  };

  return (
    <div className="min-h-[100dvh]">
      {/* Hero Section - Split Screen Layout */}
      <section className="relative min-h-[600px] bg-[var(--surface)] overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--accent-subtle)] rounded-full blur-[80px] opacity-50" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[var(--accent-subtle)] rounded-full blur-[60px] opacity-30" />

        {/* Grid Layout */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="space-y-8 fade-in">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight">
                  数字货币与实物
                  <span className="block text-[var(--accent)]">锚定交易平台</span>
                </h1>
                <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-lg leading-relaxed">
                  使用稳定币 USDT 交易现实物品，安全托管，信誉保障
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/register"
                      className="px-8 py-4 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98] shadow-[var(--shadow-md)]"
                    >
                      立即注册
                    </Link>
                    <Link
                      href="/items"
                      className="px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-xl font-semibold hover:border-[var(--text-muted)] transition-all duration-150"
                    >
                      浏览物品
                      <ArrowIcon />
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/items/create"
                    className="px-8 py-4 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98] shadow-[var(--shadow-md)]"
                  >
                    发布物品
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-[var(--text)]">100+</p>
                  <p className="text-sm text-[var(--text-muted)]">活跃用户</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-[var(--text)]">50+</p>
                  <p className="text-sm text-[var(--text-muted)]">在售物品</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-[var(--text)]">99%</p>
                  <p className="text-sm text-[var(--text-muted)]">交易成功</p>
                </div>
              </div>
            </div>

            {/* Right: Visual Element */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] bg-gradient-to-br from-[var(--surface-hover)] to-[var(--accent-subtle)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow-lg)] overflow-hidden">
                {/* Abstract Visual */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-[var(--accent)] rounded-2xl transform rotate-12 shadow-[var(--shadow-lg)]" />
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-[var(--accent-light)] rounded-xl opacity-60" />
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white rounded-lg shadow-[var(--shadow-md)]" />
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute top-10 right-10 w-20 h-20 bg-[var(--surface)] rounded-xl shadow-[var(--shadow-md)] flex items-center justify-center">
                  <WalletIcon />
                </div>
                <div className="absolute bottom-20 left-10 w-16 h-16 bg-[var(--surface)] rounded-xl shadow-[var(--shadow-md)] flex items-center justify-center">
                  <ShieldIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Prices Section */}
      <section className="py-8 bg-[var(--canvas)] border-y border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 overflow-x-auto pb-2">
            <h2 className="text-lg font-semibold text-[var(--text)] whitespace-nowrap">实时行情</h2>
            {TOKENS.map((token) => {
              const priceInfo = prices[token.symbol];
              const changePositive = priceInfo?.change24h >= 0;

              return (
                <Link
                  key={token.symbol}
                  href="/market"
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-200 whitespace-nowrap"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: token.color }}
                  >
                    {token.symbol.slice(0, 2)}
                  </div>
                  <span className="font-semibold text-[var(--text)]">{token.symbol}</span>
                  <span className="text-sm font-mono text-[var(--text-muted)]">
                    ${priceInfo?.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '--'}
                  </span>
                  <span className={`text-xs font-medium ${changePositive ? 'text-green-600' : 'text-red-600'}`}>
                    {changePositive ? '+' : ''}{priceInfo?.change24h?.toFixed(1) || '--'}%
                  </span>
                </Link>
              );
            })}
            <Link href="/market" className="flex items-center gap-1 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors whitespace-nowrap">
              更多
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-20 lg:py-32 bg-[var(--canvas)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              平台特色
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              安全、透明、可信的数字货币交易体验
            </p>
          </div>

          {/* Bento Grid - Asymmetric Layout */}
          <div className="grid md:grid-cols-3 gap-6 stagger-container">
            {/* Large Card */}
            <div className="md:col-span-2 p-8 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] space-y-4">
              <WalletIcon />
              <h3 className="text-2xl font-bold text-[var(--text)]">USDT 交易</h3>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-md">
                使用稳定币 USDT 进行交易，避免加密货币价格波动风险。支持 TRON 链上充值，自动入账。
              </p>
              <div className="flex gap-4 pt-4">
                <span className="px-3 py-1 bg-[var(--accent-subtle)] text-[var(--accent)] rounded-full text-sm font-medium">TRC-20</span>
                <span className="px-3 py-1 bg-[var(--surface-hover)] text-[var(--text-muted)] rounded-full text-sm font-medium">自动充值</span>
              </div>
            </div>

            {/* Small Card */}
            <div className="p-8 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] space-y-4">
              <ShieldIcon />
              <h3 className="text-xl font-bold text-[var(--text)]">资金托管</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                买家付款后资金被平台托管，确认收货后自动释放给卖家。
              </p>
            </div>

            {/* Small Card */}
            <div className="p-8 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] space-y-4">
              <StarIcon />
              <h3 className="text-xl font-bold text-[var(--text)]">信誉系统</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                买卖双方互评累积信誉分，保障交易安全可信。
              </p>
            </div>

            {/* Large Card */}
            <div className="md:col-span-2 p-8 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] rounded-2xl shadow-[var(--shadow-lg)] space-y-4">
              <div className="flex items-center gap-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M24 12v24M12 24h24M8 8l32 32M8 40l32-32" />
                </svg>
                <div>
                  <h3 className="text-2xl font-bold text-white">争议仲裁</h3>
                  <p className="text-white/80 leading-relaxed max-w-md">
                    遇到交易纠纷？平台提供专业的争议仲裁服务，管理员介入处理，保障双方权益。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Items Section */}
      <section className="py-20 lg:py-32 bg-[var(--surface)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                最新物品
              </h2>
              <p className="mt-2 text-[var(--text-muted)]">发现心仪之物</p>
            </div>
            <Link href="/items" className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
              查看全部
              <ArrowIcon />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton skeleton-card rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--canvas)] rounded-2xl border border-[var(--border)]">
              <PackageIcon />
              <p className="mt-6 text-lg text-[var(--text-muted)]">暂无物品，成为第一个发布者</p>
              {isAuthenticated && (
                <Link
                  href="/items/create"
                  className="mt-6 inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  发布物品
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-container">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="group bg-[var(--canvas)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--accent)] transition-all duration-300 overflow-hidden"
                >
                  <div className="h-48 bg-[var(--surface-hover)] flex items-center justify-center overflow-hidden">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <PackageIcon />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--accent)]">
                      {Number(item.price).toLocaleString()} <span className="text-sm font-medium text-[var(--text-muted)]">USDT</span>
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
                          <span className="text-xs font-semibold text-[var(--accent)]">
                            {item.seller.nickname[0]}
                          </span>
                        </div>
                        <span className="text-sm text-[var(--text-muted)]">{item.seller.nickname}</span>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-[var(--text-muted)]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--accent)">
                          <path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-2.5 2 .5-3.5L2.5 5l3.5-.5L7 1z" />
                        </svg>
                        {item.seller.reputation}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--accent)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-white/80 mb-8">
            注册账户，发布你的第一个物品，或者浏览市场找到心仪之物
          </p>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-white text-[var(--accent)] rounded-xl font-semibold hover:bg-white/90 transition-all duration-150 shadow-lg"
            >
              免费注册
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
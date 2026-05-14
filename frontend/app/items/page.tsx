'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { itemsApi } from '@/lib/api';
import { Item } from '@/lib/types';
import { SearchIcon, FilterIcon, PackageIcon, StarIcon } from '@/components/Icons';

const CATEGORIES = ['电子产品', '服装鞋帽', '家居用品', '运动户外', '图书文具', '其他'];

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await itemsApi.getAll({
        search: search || undefined,
        category: category || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        take: 50,
      });
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            物品市场
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">发现心仪之物，开启交易</p>
        </div>

        {/* Filters */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text)] mb-2">搜索</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索物品..."
                    className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">分类</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 pr-10 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150 appearance-none cursor-pointer"
                  >
                    <option value="">全部分类</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">最低价</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">最高价</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="不限"
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98]"
              >
                <SearchIcon />
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton skeleton-card rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <PackageIcon />
            <p className="mt-6 text-lg text-[var(--text-muted)]">暂无物品</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-container">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--accent)] transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-[var(--canvas)] flex items-center justify-center overflow-hidden">
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
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2">{item.description}</p>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {Number(item.price).toLocaleString()}
                    <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
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
                      <StarIcon />
                      {item.seller.reputation}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
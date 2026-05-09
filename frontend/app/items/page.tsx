'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { itemsApi } from '@/lib/api';

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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          物品市场
        </h1>

        {/* Filters */}
        <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl mb-8 border border-white/20">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">搜索</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索物品..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              >
                <option value="">全部分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">最低价</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">最高价</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="不限"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              搜索
            </button>
          </div>
        </form>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-lg rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-xl">暂无物品</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden border border-white/20"
              >
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-6xl">📦</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg truncate text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  <p className="text-indigo-600 font-bold text-xl mt-2">{item.price} USDT</p>
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="flex items-center text-gray-600">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">{item.seller.nickname[0]}</span>
                      </div>
                      {item.seller.nickname}
                    </span>
                    <span className="flex items-center text-yellow-500">
                      ⭐ {item.seller.reputation}
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

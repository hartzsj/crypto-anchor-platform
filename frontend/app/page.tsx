'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { itemsApi } from '@/lib/api';
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

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadItems();
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

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
              🔗 CryptoAnchor
            </h1>
            <p className="text-2xl md:text-3xl mb-8 opacity-95 max-w-3xl mx-auto font-light">
              数字货币与实物锚定交易平台
            </p>
            <p className="text-lg mb-12 opacity-90 max-w-2xl mx-auto">
              使用稳定币USDT交易现实物品，安全托管，信誉保障
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  立即注册
                </Link>
                <Link
                  href="/items"
                  className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all transform hover:-translate-y-1"
                >
                  浏览物品
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <Link
                href="/items/create"
                className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl transform hover:-translate-y-1"
              >
                发布物品
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          平台特色
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-3xl">💰</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">USDT 交易</h3>
            <p className="text-gray-600 leading-relaxed">
              使用稳定币 USDT 进行交易，避免加密货币价格波动风险
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-3xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">资金托管</h3>
            <p className="text-gray-600 leading-relaxed">
              买家付款后资金被平台托管，确认收货后自动释放给卖家
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-3xl">⭐</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">信誉系统</h3>
            <p className="text-gray-600 leading-relaxed">
              买卖双方互评累积信誉分，保障交易安全可信
            </p>
          </div>
        </div>
      </div>

      {/* Latest Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            最新物品
          </h2>
          <Link href="/items" className="text-indigo-600 hover:text-indigo-700 font-semibold text-lg">
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-lg rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-xl">暂无物品，成为第一个发布者吧！</p>
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
                  <p className="text-indigo-600 font-bold text-xl mt-2">{item.price} USDT</p>
                  <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">{item.seller.nickname[0]}</span>
                      </div>
                      {item.seller.nickname}
                    </span>
                    <span className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      {item.seller.reputation}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">准备好开始了吗？</h2>
          <p className="text-xl mb-8 opacity-90">
            注册账户，发布你的第一个物品，或者浏览市场找到心仪之物
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl transform hover:-translate-y-1"
          >
            免费注册
          </Link>
        </div>
      </div>
    </div>
  );
}

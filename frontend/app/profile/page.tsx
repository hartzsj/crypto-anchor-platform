'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi, itemsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  itemsCount: number;
  buyOrdersCount: number;
  sellOrdersCount: number;
  totalOrders: number;
  reviewsReceivedCount: number;
  reviewsGivenCount: number;
  avgRating: number;
  goodRate: number;
}

interface Item {
  id: string;
  title: string;
  images: string[];
  price: number;
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'items'>('stats');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [meRes, itemsRes] = await Promise.all([
        usersApi.getMe(),
        usersApi.getMyItems(),
      ]);
      setStats(meRes.data.stats);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white text-4xl font-bold">{user?.email?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.email}</h1>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-yellow-500">
                    <span className="text-2xl mr-1">⭐</span>
                    <span className="font-semibold">{stats?.avgRating || 0}</span>
                    <span className="text-gray-500 text-sm ml-1">({stats?.reviewsReceivedCount || 0}评价)</span>
                  </span>
                  <span className="text-green-600 font-semibold">好评率 {stats?.goodRate || 100}%</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  注册时间: {new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
            >
              编辑资料
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">发布物品</p>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{stats?.itemsCount || 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">购买订单</p>
              <span className="text-2xl">🛒</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats?.buyOrdersCount || 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">销售订单</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats?.sellOrdersCount || 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">总交易</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats?.totalOrders || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            信誉统计
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            我的物品
          </button>
        </div>

        {/* Content */}
        {activeTab === 'stats' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6">信誉详情</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">评价统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均评分</span>
                    <span className="font-semibold text-yellow-500">⭐ {stats?.avgRating || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">收到评价</span>
                    <span className="font-semibold">{stats?.reviewsReceivedCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">给出评价</span>
                    <span className="font-semibold">{stats?.reviewsGivenCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">好评率</span>
                    <span className="font-semibold text-green-600">{stats?.goodRate || 100}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">交易统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">发布物品</span>
                    <span className="font-semibold">{stats?.itemsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">作为买家</span>
                    <span className="font-semibold">{stats?.buyOrdersCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">作为卖家</span>
                    <span className="font-semibold">{stats?.sellOrdersCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">总交易次数</span>
                    <span className="font-semibold">{stats?.totalOrders || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">我的物品</h2>
              <Link
                href="/items/create"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700"
              >
                发布新物品
              </Link>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500">暂无发布物品</p>
                <Link href="/items/create" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
                  发布第一个物品 →
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                  >
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-6xl">📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold truncate">{item.title}</h3>
                      <p className="text-indigo-600 font-bold mt-2">{Number(item.price).toFixed(2)} USDT</p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                        item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'APPROVED' ? '已审核' : item.status === 'PENDING' ? '待审核' : '已拒绝'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
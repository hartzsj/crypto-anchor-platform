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

// SVG Icons
const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="8" width="24" height="18" rx="2" />
    <path d="M4 12h24M16 8v18M10 8l6 4 6-4" />
  </svg>
);

const CartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="24" r="3" />
    <circle cx="22" cy="24" r="3" />
    <path d="M4 4h4l4 16h12l4-8H8" />
  </svg>
);

const CoinsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="16" r="8" />
    <path d="M12 8v16M8 12h8M8 20h8" />
    <circle cx="20" cy="16" r="8" opacity="0.5" />
  </svg>
);

const ChartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 28V16l6 4 6-8 6 6 6-4v12H4z" />
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--accent)">
    <path d="M9 1l2 4 4.5.5-3 3 .5 4.5L9 11l-3 2 .5-4.5-3-3L7 5l2-4z" />
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 16h12M14 4l2 2L6 16H4v-2L14 4z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 4v12M4 10h12" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1">
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40" />
  </svg>
);

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="skeleton w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-8 mb-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-md)]">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white text-3xl font-bold">{user?.email?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">{user?.email}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-[var(--accent)]">
                    <StarIcon />
                    <span className="font-semibold">{stats?.avgRating || 0}</span>
                    <span className="text-[var(--text-muted)] text-sm">({stats?.reviewsReceivedCount || 0}评价)</span>
                  </span>
                  <span className="text-green-600 font-semibold">好评率 {stats?.goodRate || 100}%</span>
                </div>
                <p className="text-[var(--text-subtle)] text-sm mt-2">
                  注册时间: {new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98] shadow-[var(--shadow-md)]"
            >
              <EditIcon />
              编辑资料
            </Link>
          </div>
        </div>

        {/* Stats Cards - Bento Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 stagger-container">
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">发布物品</p>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <PackageIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--accent)] font-mono">{stats?.itemsCount || 0}</p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">购买订单</p>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <CartIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600 font-mono">{stats?.buyOrdersCount || 0}</p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">销售订单</p>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                <CoinsIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600 font-mono">{stats?.sellOrdersCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] p-6 rounded-2xl shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">总交易</p>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <ChartIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{stats?.totalOrders || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'stats'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            信誉统计
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'items'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            我的物品
          </button>
        </div>

        {/* Content */}
        {activeTab === 'stats' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
            <h2 className="text-xl font-semibold text-[var(--text)] mb-6">信誉详情</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-[var(--text)] mb-4">评价统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">平均评分</span>
                    <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                      <StarIcon />
                      {stats?.avgRating || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">收到评价</span>
                    <span className="font-semibold font-mono">{stats?.reviewsReceivedCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">给出评价</span>
                    <span className="font-semibold font-mono">{stats?.reviewsGivenCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">好评率</span>
                    <span className="font-semibold text-green-600">{stats?.goodRate || 100}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text)] mb-4">交易统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">发布物品</span>
                    <span className="font-semibold font-mono">{stats?.itemsCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">作为买家</span>
                    <span className="font-semibold font-mono">{stats?.buyOrdersCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">作为卖家</span>
                    <span className="font-semibold font-mono">{stats?.sellOrdersCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">总交易次数</span>
                    <span className="font-semibold font-mono">{stats?.totalOrders || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text)]">我的物品</h2>
              <Link
                href="/items/create"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-150"
              >
                <PlusIcon />
                发布新物品
              </Link>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <EmptyIcon />
                <p className="mt-6 text-[var(--text-muted)]">暂无发布物品</p>
                <Link
                  href="/items/create"
                  className="mt-4 inline-block text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                >
                  发布第一个物品
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-container">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="group bg-[var(--canvas)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--accent)] transition-all duration-300 overflow-hidden"
                  >
                    <div className="h-48 bg-[var(--surface-hover)] flex items-center justify-center overflow-hidden">
                      {item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <EmptyIcon />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-lg font-bold text-[var(--accent)] font-mono">
                        {Number(item.price).toLocaleString()}
                        <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
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
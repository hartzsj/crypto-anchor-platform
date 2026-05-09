'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, THEMES } from '@/contexts/ThemeContext';
import { adminApi, api, itemsApi, ordersApi } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalItems: number;
  totalOrders: number;
  pendingItems: number;
  disputedOrders: number;
  totalVolume: number;
  newUsersToday: number;
  newOrdersToday: number;
}

interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  seller: { id: string; username: string; nickname: string; reputation: number };
  status: string;
  createdAt: string;
}

interface Order {
  id: string;
  price: number;
  status: string;
  logisticsCompany: string;
  trackingNumber: string;
  createdAt: string;
  item: { id: string; title: string; images: string[] };
  buyer: { id: string; nickname: string; email: string; reputation?: number };
  seller: { id: string; nickname: string; email: string; reputation?: number };
}

interface User {
  id: string;
  email: string;
  username: string;
  nickname: string;
  avatar: string | null;
  role: string;
  reputation: number;
  createdAt: string;
  wallet?: { balance: number; frozenBalance: number };
}

const STATUS_MAP: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  DISPUTED: '争议中',
};

// SVG Icons
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 20c0-4 3-7 6-7s6 3 6 7" />
    <circle cx="17" cy="7" r="3" />
    <path d="M17 14c3 0 5 2 5 6" />
  </svg>
);

const OrdersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 8h18M7 12h10M7 16h6" />
  </svg>
);

const CoinsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v16M8 8h8M8 16h8" />
  </svg>
);

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M12 6v14M8 6l4 4 4-4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L2 20h20L12 2z" />
    <path d="M12 10v4M12 16v1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ScaleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4v16M4 8l4-4 4 4M12 8l4-4 4 4M4 8v6a4 4 0 008 0V8M12 8v6a4 4 0 008 0V8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 10l4 4 8-8" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4l12 12M16 4l-12 12" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--accent)">
    <path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-2.5 2 .5-3.5L2.5 5l3.5-.5L7 1z" />
  </svg>
);

const PaletteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="2" fill="currentColor" />
    <circle cx="8" cy="12" r="2" fill="currentColor" />
    <circle cx="16" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="16" r="2" fill="currentColor" />
    <path d="M12 2c2 0 4 1 6 3" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'orders' | 'users' | 'disputes' | 'theme'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [approvedItems, setApprovedItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [disputedOrders, setDisputedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newReputation, setNewReputation] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [activeTab, orderFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsRes = await adminApi.getStats();
        setStats(statsRes.data);
      } else if (activeTab === 'items') {
        const [pendingRes, approvedRes] = await Promise.all([
          api.get('/items', { params: { status: 'PENDING', take: 50 } }),
          api.get('/items', { params: { status: 'APPROVED', take: 20 } }),
        ]);
        setPendingItems(pendingRes.data.items || []);
        setApprovedItems(approvedRes.data.items || []);
      } else if (activeTab === 'orders') {
        const ordersRes = await adminApi.getOrders(orderFilter);
        setOrders(ordersRes.data.orders || []);
      } else if (activeTab === 'users') {
        const usersRes = await adminApi.getUsers();
        setUsers(usersRes.data.users || []);
      } else if (activeTab === 'disputes') {
        const disputedRes = await adminApi.getDisputedOrders();
        setDisputedOrders(disputedRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      await itemsApi.approve(itemId);
      alert('审核通过');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (itemId: string) => {
    if (!rejectReason) {
      alert('请填写拒绝原因');
      return;
    }
    try {
      await itemsApi.reject(itemId, rejectReason);
      alert('已拒绝');
      setRejectReason('');
      setRejectingItemId(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleResolveDispute = async (orderId: string, refund: boolean) => {
    const action = refund ? '退款给买家' : '放款给卖家';
    if (!confirm(`确认${action}？此操作不可撤销。`)) return;
    try {
      await ordersApi.resolve(orderId, refund);
      alert(`已${action}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleSetRole = async (userId: string, role: 'USER' | 'ADMIN') => {
    try {
      await adminApi.setUserRole(userId, role);
      alert('角色已更新');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleSetReputation = async (userId: string) => {
    try {
      await adminApi.setUserReputation(userId, newReputation);
      alert('信誉分已更新');
      setEditingUserId(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)]">
          <p className="text-[var(--text-muted)]">无权访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            管理后台
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">平台运营管理中心</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'dashboard', label: '数据概览' },
            { key: 'items', label: '物品审核', badge: stats?.pendingItems },
            { key: 'orders', label: '订单管理' },
            { key: 'users', label: '用户管理' },
            { key: 'disputes', label: '争议处理', badge: stats?.disputedOrders },
            { key: 'theme', label: '外观设置' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-150 flex items-center ${
                activeTab === tab.key
                  ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
              }`}
            >
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards - Bento Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8 stagger-container">
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-[var(--text-muted)]">总用户</p>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <UsersIcon />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600 font-mono">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-[var(--text-subtle)] mt-2">今日新增 +{stats?.newUsersToday || 0}</p>
              </div>
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-[var(--text-muted)]">总订单</p>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <OrdersIcon />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 font-mono">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-[var(--text-subtle)] mt-2">今日新增 +{stats?.newOrdersToday || 0}</p>
              </div>
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-[var(--text-muted)]">总交易额</p>
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                    <CoinsIcon />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--accent)] font-mono">
                  {Number(stats?.totalVolume || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-subtle)] mt-2">USDT</p>
              </div>
              <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] p-6 rounded-2xl shadow-[var(--shadow-md)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-white/80">总物品</p>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <PackageIcon />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats?.totalItems || 0}</p>
                <p className="text-xs text-white/70 mt-2">待审核 {stats?.pendingItems || 0}</p>
              </div>
            </div>

            {/* Alerts */}
            {((stats?.pendingItems || 0) > 0 || (stats?.disputedOrders || 0) > 0) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {(stats?.pendingItems || 0) > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <PackageIcon />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-800">待审核物品</p>
                        <p className="text-sm text-yellow-600">有 {stats?.pendingItems || 0} 个物品等待审核</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('items')}
                        className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all duration-150"
                      >
                        去审核
                      </button>
                    </div>
                  </div>
                )}
                {(stats?.disputedOrders || 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                        <AlertIcon />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">争议订单</p>
                        <p className="text-sm text-red-600">有 {stats?.disputedOrders || 0} 个订单待仲裁</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('disputes')}
                        className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-150"
                      >
                        去处理
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)] mb-4">快捷操作</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('items')}
                  className="p-4 bg-[var(--canvas)] rounded-xl hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] mb-2">
                    <PackageIcon />
                  </div>
                  <p className="font-medium text-[var(--text)]">审核物品</p>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="p-4 bg-[var(--canvas)] rounded-xl hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-2">
                    <OrdersIcon />
                  </div>
                  <p className="font-medium text-[var(--text)]">查看订单</p>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-[var(--canvas)] rounded-xl hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                    <UsersIcon />
                  </div>
                  <p className="font-medium text-[var(--text)]">管理用户</p>
                </button>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className="p-4 bg-[var(--canvas)] rounded-xl hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-2">
                    <ScaleIcon />
                  </div>
                  <p className="font-medium text-[var(--text)]">争议仲裁</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-4">待审核物品</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="skeleton w-12 h-12 rounded-2xl" />
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
                  <CheckIcon />
                </div>
                <p className="text-[var(--text-muted)]">暂无待审核物品</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-24 h-24 bg-[var(--canvas)] rounded-xl flex items-center justify-center flex-shrink-0">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <PackageIcon />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-[var(--text)]">{item.title}</h3>
                          <p className="text-[var(--accent)] font-bold font-mono">
                            {Number(item.price).toLocaleString()}
                            <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                          </p>
                          <p className="text-sm text-[var(--text-muted)] mt-1">分类: {item.category}</p>
                          <p className="text-sm text-[var(--text-muted)]">卖家: {item.seller.nickname}</p>
                          <p className="text-sm text-[var(--text-subtle)] mt-2 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-150"
                        >
                          <CheckIcon />
                          通过
                        </button>
                        <button
                          onClick={() => setRejectingItemId(rejectingItemId === item.id ? null : item.id)}
                          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-150"
                        >
                          <XIcon />
                          拒绝
                        </button>
                      </div>
                    </div>
                    {rejectingItemId === item.id && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">拒绝原因</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 px-4 py-2 bg-[var(--canvas)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                            placeholder="请输入拒绝原因..."
                          />
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-150"
                          >
                            确认拒绝
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xl font-semibold text-[var(--text)] mb-4 mt-8">已通过物品</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {approvedItems.map((item) => (
                <div key={item.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-[var(--canvas)] rounded-lg flex items-center justify-center">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <PackageIcon />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--text)] truncate">{item.title}</h4>
                      <p className="text-[var(--accent)] font-bold font-mono">
                        {Number(item.price).toLocaleString()}
                        <span className="text-xs font-medium text-[var(--text-muted)] ml-1">USDT</span>
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{item.seller.nickname}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-4 bg-[var(--canvas)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">筛选：</span>
                {['', 'PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELED', 'DISPUTED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderFilter(s)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150 ${
                      orderFilter === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {s ? STATUS_MAP[s] : '全部'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="skeleton w-12 h-12 rounded-2xl" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--canvas)]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">物品</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">买家</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">卖家</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">金额</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-muted)]">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-[var(--canvas)] rounded-lg flex items-center justify-center">
                            {order.item.images?.[0] ? (
                              <img src={order.item.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <PackageIcon />
                            )}
                          </div>
                          <span className="font-medium text-[var(--text)] truncate max-w-32">{order.item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{order.buyer.nickname}</td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{order.seller.nickname}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[var(--accent)] font-mono">
                        {Number(order.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          order.status === 'PAID' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'DISPUTED' ? 'bg-red-100 text-red-700' :
                          'bg-[var(--canvas)] text-[var(--text-muted)]'
                        }`}>
                          {STATUS_MAP[order.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-subtle)]">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="skeleton w-12 h-12 rounded-2xl" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--canvas)]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">用户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">邮箱</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-muted)]">角色</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-muted)]">信誉分</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">余额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">注册时间</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-muted)]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                            <span className="text-white font-bold">{u.nickname[0]}</span>
                          </div>
                          <span className="font-medium text-[var(--text)]">{u.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--canvas)] text-[var(--text-muted)]'
                        }`}>
                          {u.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-[var(--accent)]">
                          <StarIcon />
                          <span className="font-mono">{u.reputation}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-green-600 font-mono">
                        {Number(u.wallet?.balance || 0).toLocaleString()}
                        <span className="text-xs font-medium text-[var(--text-muted)] ml-1">USDT</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-subtle)]">
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleSetRole(u.id, 'ADMIN')}
                              className="px-2 py-1 bg-[var(--accent-subtle)] text-[var(--accent)] rounded text-xs font-medium hover:bg-[var(--accent-light)] transition-all duration-150"
                            >
                              设为管理员
                            </button>
                          )}
                          {u.role === 'ADMIN' && u.id !== user?.id && (
                            <button
                              onClick={() => handleSetRole(u.id, 'USER')}
                              className="px-2 py-1 bg-[var(--canvas)] text-[var(--text-muted)] rounded text-xs font-medium hover:bg-[var(--surface-hover)] transition-all duration-150"
                            >
                              撤销管理员
                            </button>
                          )}
                          {editingUserId === u.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={newReputation}
                                onChange={(e) => setNewReputation(Number(e.target.value))}
                                className="w-16 px-1 py-1 border border-[var(--border)] rounded text-xs text-[var(--text)] bg-[var(--canvas)]"
                              />
                              <button
                                onClick={() => handleSetReputation(u.id)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-all duration-150"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2 py-1 bg-[var(--canvas)] text-[var(--text-muted)] rounded text-xs font-medium hover:bg-[var(--surface-hover)] transition-all duration-150"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setNewReputation(u.reputation);
                              }}
                              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition-all duration-150"
                            >
                              调整信誉
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-4">争议订单仲裁</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="skeleton w-12 h-12 rounded-2xl" />
              </div>
            ) : disputedOrders.length === 0 ? (
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] mb-4">
                  <ScaleIcon />
                </div>
                <p className="text-[var(--text-muted)]">暂无争议订单</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputedOrders.map((order) => (
                  <div key={order.id} className="bg-[var(--surface)] rounded-2xl border border-red-200 shadow-[var(--shadow-sm)] p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-[var(--text)]">{order.item.title}</h3>
                        <p className="text-[var(--accent)] font-bold font-mono">
                          {Number(order.price).toLocaleString()}
                          <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-[var(--text-muted)]">买家</p>
                            <p className="font-medium text-[var(--text)]">{order.buyer.nickname}</p>
                            <p className="text-xs text-[var(--text-muted)]">信誉: {order.buyer.reputation}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-xs text-[var(--text-muted)]">卖家</p>
                            <p className="font-medium text-[var(--text)]">{order.seller.nickname}</p>
                            <p className="text-xs text-[var(--text-muted)]">信誉: {order.seller.reputation}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-subtle)] mt-2">
                          订单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleResolveDispute(order.id, true)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-150"
                        >
                          退款给买家
                        </button>
                        <button
                          onClick={() => handleResolveDispute(order.id, false)}
                          className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-150"
                        >
                          放款给卖家
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <div>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                  <PaletteIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text)]">平台外观设置</h2>
                  <p className="text-[var(--text-muted)]">选择平台主题配色方案</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(THEMES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key as any)}
                    className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
                      theme === key
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[var(--shadow-md)]'
                        : 'border-[var(--border)] bg-[var(--canvas)] hover:border-[var(--text-muted)] hover:shadow-[var(--shadow-sm)]'
                    }`}
                  >
                    {/* Preview Color */}
                    <div
                      className="w-full h-16 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: config.accent }}
                    />

                    {/* Theme Info */}
                    <div className="text-left">
                      <h3 className="font-semibold text-[var(--text)]">{config.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{config.nameEn}</p>
                    </div>

                    {/* Selected Indicator */}
                    {theme === key && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                        <CheckCircleIcon />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-6">预览效果</h3>

              {/* Preview Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98]">
                  主按钮
                </button>
                <button className="px-6 py-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl font-semibold hover:border-[var(--text-muted)] transition-all duration-150">
                  次按钮
                </button>
                <span className="px-4 py-2 bg-[var(--accent-subtle)] text-[var(--accent)] rounded-full font-medium">
                  标签样式
                </span>
              </div>

              {/* Preview Card */}
              <div className="bg-[var(--canvas)] p-6 rounded-xl border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white">
                    <span className="font-bold">A</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)]">卡片标题</p>
                    <p className="text-sm text-[var(--text-muted)]">卡片描述文字</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--accent)] font-mono">
                  1,234
                  <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                </p>
              </div>

              {/* Info */}
              <p className="mt-6 text-sm text-[var(--text-muted)]">
                当前主题: <span className="font-semibold text-[var(--accent)]">{THEMES[theme].name}</span> ({THEMES[theme].nameEn})
              </p>
              <p className="text-xs text-[var(--text-subtle)] mt-2">
                主题设置保存在浏览器本地，切换主题后全站配色立即生效
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
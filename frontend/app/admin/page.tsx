'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'orders' | 'users' | 'disputes'>('dashboard');
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
      alert('✅ 审核通过！');
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '操作失败'));
    }
  };

  const handleReject = async (itemId: string) => {
    if (!rejectReason) {
      alert('请填写拒绝原因');
      return;
    }
    try {
      await itemsApi.reject(itemId, rejectReason);
      alert('✅ 已拒绝');
      setRejectReason('');
      setRejectingItemId(null);
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '操作失败'));
    }
  };

  const handleResolveDispute = async (orderId: string, refund: boolean) => {
    const action = refund ? '退款给买家' : '放款给卖家';
    if (!confirm(`确认${action}？此操作不可撤销。`)) return;
    try {
      await ordersApi.resolve(orderId, refund);
      alert(`✅ 已${action}`);
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '操作失败'));
    }
  };

  const handleSetRole = async (userId: string, role: 'USER' | 'ADMIN') => {
    try {
      await adminApi.setUserRole(userId, role);
      alert('✅ 角色已更新');
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '操作失败'));
    }
  };

  const handleSetReputation = async (userId: string) => {
    try {
      await adminApi.setUserReputation(userId, newReputation);
      alert('✅ 信誉分已更新');
      setEditingUserId(null);
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '操作失败'));
    }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center">无权访问</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            管理后台
          </h1>
          <p className="text-gray-600 mt-2">平台运营管理中心</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap space-x-2 mb-6 gap-2">
          {[
            { key: 'dashboard', label: '数据概览' },
            { key: 'items', label: '物品审核', badge: stats?.pendingItems },
            { key: 'orders', label: '订单管理' },
            { key: 'users', label: '用户管理' },
            { key: 'disputes', label: '争议处理', badge: stats?.disputedOrders },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm opacity-80">总用户</p>
                <p className="text-4xl font-bold mt-2">{stats?.totalUsers || 0}</p>
                <p className="text-xs opacity-70 mt-2">今日新增 +{stats?.newUsersToday || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm opacity-80">总订单</p>
                <p className="text-4xl font-bold mt-2">{stats?.totalOrders || 0}</p>
                <p className="text-xs opacity-70 mt-2">今日新增 +{stats?.newOrdersToday || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm opacity-80">总交易额</p>
                <p className="text-4xl font-bold mt-2">{Number(stats?.totalVolume || 0).toFixed(2)}</p>
                <p className="text-xs opacity-70 mt-2">USDT</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-yellow-600 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm opacity-80">总物品</p>
                <p className="text-4xl font-bold mt-2">{stats?.totalItems || 0}</p>
                <p className="text-xs opacity-70 mt-2">待审核 {stats?.pendingItems || 0}</p>
              </div>
            </div>

            {/* Alerts */}
            {((stats?.pendingItems || 0) > 0 || (stats?.disputedOrders || 0) > 0) && (
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {(stats?.pendingItems || 0) > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📦</span>
                      <div>
                        <p className="font-semibold text-yellow-800">待审核物品</p>
                        <p className="text-sm text-yellow-600">有 {stats?.pendingItems || 0} 个物品等待审核</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('items')}
                        className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                      >
                        去审核
                      </button>
                    </div>
                  </div>
                )}
                {(stats?.disputedOrders || 0) > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div>
                        <p className="font-semibold text-red-800">争议订单</p>
                        <p className="text-sm text-red-600">有 {stats?.disputedOrders || 0} 个订单待仲裁</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('disputes')}
                        className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        去处理
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4">快捷操作</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('items')}
                  className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
                >
                  <span className="text-3xl mb-2 block">📦</span>
                  <p className="font-semibold">审核物品</p>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all"
                >
                  <span className="text-3xl mb-2 block">📋</span>
                  <p className="font-semibold">查看订单</p>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all"
                >
                  <span className="text-3xl mb-2 block">👥</span>
                  <p className="font-semibold">管理用户</p>
                </button>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                >
                  <span className="text-3xl mb-2 block">⚖️</span>
                  <p className="font-semibold">争议仲裁</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">待审核物品</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center text-gray-500 border border-white/20">
                <div className="text-4xl mb-4">✅</div>
                <p>暂无待审核物品</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-gray-400 text-3xl">📦</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <p className="text-indigo-600 font-bold">{item.price} USDT</p>
                          <p className="text-sm text-gray-500 mt-1">分类: {item.category}</p>
                          <p className="text-sm text-gray-500">卖家: {item.seller.nickname}</p>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => setRejectingItemId(rejectingItemId === item.id ? null : item.id)}
                          className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 shadow-lg transition-all"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                    {rejectingItemId === item.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">拒绝原因</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="请输入拒绝原因..."
                          />
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
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

            <h2 className="text-2xl font-bold mb-4 mt-8 text-gray-900">已通过物品</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {approvedItems.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-gray-400 text-2xl">📦</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold truncate">{item.title}</h4>
                      <p className="text-indigo-600 font-bold">{item.price} USDT</p>
                      <p className="text-xs text-gray-500">{item.seller.nickname}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">筛选：</span>
                {['', 'PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELED', 'DISPUTED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderFilter(s)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      orderFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s ? STATUS_MAP[s] : '全部'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">物品</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">买家</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">卖家</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">金额</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {order.item.images?.[0] ? (
                              <img src={order.item.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-gray-400">📦</span>
                            )}
                          </div>
                          <span className="font-medium truncate max-w-32">{order.item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{order.buyer.nickname}</td>
                      <td className="py-3 px-4 text-sm">{order.seller.nickname}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">{Number(order.price).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PAID' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {STATUS_MAP[order.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">用户</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">邮箱</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">角色</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">信誉分</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">余额</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">注册时间</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{u.nickname[0]}</span>
                          </div>
                          <span className="font-semibold">{u.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-yellow-500">⭐ {u.reputation}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">
                        {Number(u.wallet?.balance || 0).toFixed(2)} USDT
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleSetRole(u.id, 'ADMIN')}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                            >
                              设为管理员
                            </button>
                          )}
                          {u.role === 'ADMIN' && u.id !== user?.id && (
                            <button
                              onClick={() => handleSetRole(u.id, 'USER')}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                            >
                              撤销管理员
                            </button>
                          )}
                          {editingUserId === u.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={newReputation}
                                onChange={(e) => setNewReputation(Number(e.target.value))}
                                className="w-16 px-1 py-1 border rounded text-xs"
                              />
                              <button
                                onClick={() => handleSetReputation(u.id)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
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
                              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900">争议订单仲裁</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : disputedOrders.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center text-gray-500 border border-white/20">
                <div className="text-4xl mb-4">⚖️</div>
                <p>暂无争议订单</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputedOrders.map((order) => (
                  <div key={order.id} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-red-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{order.item.title}</h3>
                        <p className="text-indigo-600 font-bold">{Number(order.price).toFixed(2)} USDT</p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">买家</p>
                            <p className="font-semibold">{order.buyer.nickname}</p>
                            <p className="text-xs text-gray-600">信誉: ⭐ {order.buyer.reputation}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">卖家</p>
                            <p className="font-semibold">{order.seller.nickname}</p>
                            <p className="text-xs text-gray-600">信誉: ⭐ {order.seller.reputation}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          订单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResolveDispute(order.id, true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                        >
                          退款给买家
                        </button>
                        <button
                          onClick={() => handleResolveDispute(order.id, false)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg"
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
      </div>
    </div>
  );
}
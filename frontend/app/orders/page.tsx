'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Order {
  id: string;
  price: number;
  status: string;
  logisticsCompany: string;
  trackingNumber: string;
  createdAt: string;
  paidAt: string;
  shippedAt: string;
  completedAt: string;
  item: {
    id: string;
    title: string;
    images: string[];
  };
  buyer?: {
    id: string;
    username: string;
    nickname: string;
  };
  seller?: {
    id: string;
    username: string;
    nickname: string;
  };
  review?: any;
}

const STATUS_MAP: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已支付（托管中）',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  DISPUTED: '争议中',
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipForm, setShipForm] = useState<{ orderId: string; logisticsCompany: string; trackingNumber: string }>({
    orderId: '',
    logisticsCompany: '',
    trackingNumber: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [activeTab, isAuthenticated, router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'buy'
        ? await ordersApi.getMyBuyOrders()
        : await ordersApi.getMySellOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ordersApi.ship(shipForm.orderId, shipForm.logisticsCompany, shipForm.trackingNumber);
      alert('✅ 发货成功！');
      setShipForm({ orderId: '', logisticsCompany: '', trackingNumber: '' });
      loadOrders();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '发货失败'));
    }
  };

  const handleConfirm = async (orderId: string) => {
    if (!confirm('确认已收到物品？')) return;
    try {
      await ordersApi.confirm(orderId);
      alert('✅ 确认收货成功！');
      loadOrders();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '确认收货失败'));
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('确认取消订单？')) return;
    try {
      await ordersApi.cancel(orderId);
      alert('✅ 订单已取消');
      loadOrders();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '取消失败'));
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          我的订单
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'buy'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            我的购买
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'sell'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            我的销售
          </button>
        </div>

        {/* Ship Form */}
        {activeTab === 'sell' && (
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl mb-6 border border-white/20">
            <h3 className="font-bold mb-4 text-lg">发货</h3>
            <form onSubmit={handleShip}>
              <div className="grid md:grid-cols-3 gap-4">
                <select
                  value={shipForm.orderId}
                  onChange={(e) => setShipForm({ ...shipForm, orderId: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                  required
                >
                  <option value="">选择待发货订单</option>
                  {orders
                    .filter((o) => o.status === 'PAID')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.item.title} - {o.price} USDT
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  placeholder="物流公司"
                  value={shipForm.logisticsCompany}
                  onChange={(e) => setShipForm({ ...shipForm, logisticsCompany: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                  required
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="物流单号"
                    value={shipForm.trackingNumber}
                    onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
                  >
                    发货
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      {order.item.images?.[0] ? (
                        <img src={order.item.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-gray-400 text-3xl">📦</span>
                      )}
                    </div>
                    <div>
                      <Link href={`/items/${order.item.id}`} className="font-bold text-lg hover:text-indigo-600 transition-colors">
                        {order.item.title}
                      </Link>
                      <p className="text-indigo-600 font-bold text-xl mt-1">{order.price} USDT</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activeTab === 'buy' ? `卖家: ${order.seller?.nickname}` : `买家: ${order.buyer?.nickname}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PAID' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'CANCELED' ? 'bg-gray-100 text-gray-800' :
                      order.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {STATUS_MAP[order.status]}
                    </span>

                    <div className="mt-4 space-y-2">
                      {activeTab === 'buy' && order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="w-full text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                        >
                          取消订单
                        </button>
                      )}
                      {activeTab === 'buy' && order.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleConfirm(order.id)}
                          className="w-full text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                        >
                          确认收货
                        </button>
                      )}
                      {order.trackingNumber && (
                        <p className="text-xs text-gray-500 mt-2">
                          📦 {order.logisticsCompany} - {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

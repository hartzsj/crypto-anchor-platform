'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Order, ORDER_STATUS_MAP } from '@/lib/types';
import { PackageSmallIcon, TruckIcon, CheckIcon, XIcon, EmptyBoxIcon } from '@/components/Icons';

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
      alert('发货成功');
      setShipForm({ orderId: '', logisticsCompany: '', trackingNumber: '' });
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || '发货失败');
    }
  };

  const handleConfirm = async (orderId: string) => {
    if (!confirm('确认已收到物品？')) return;
    try {
      await ordersApi.confirm(orderId);
      alert('确认收货成功');
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || '确认收货失败');
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('确认取消订单？')) return;
    try {
      await ordersApi.cancel(orderId);
      alert('订单已取消');
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || '取消失败');
    }
  };

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            我的订单
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">管理你的交易订单</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'buy'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            我的购买
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'sell'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            我的销售
          </button>
        </div>

        {/* Ship Form */}
        {activeTab === 'sell' && (
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <TruckIcon />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)]">发货</h3>
            </div>
            <form onSubmit={handleShip}>
              <div className="grid md:grid-cols-3 gap-4">
                <select
                  value={shipForm.orderId}
                  onChange={(e) => setShipForm({ ...shipForm, orderId: e.target.value })}
                  className="px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
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
                  className="px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="物流单号"
                    value={shipForm.trackingNumber}
                    onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
                    className="flex-1 px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98]"
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
            <div className="skeleton w-16 h-16 rounded-2xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <EmptyBoxIcon />
            <p className="mt-6 text-lg text-[var(--text-muted)]">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-container">
            {orders.map((order) => (
              <div key={order.id} className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-24 h-24 bg-[var(--canvas)] rounded-xl flex items-center justify-center flex-shrink-0">
                      {order.item.images?.[0] ? (
                        <img src={order.item.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <PackageSmallIcon />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/items/${order.item.id}`}
                        className="font-semibold text-lg text-[var(--text)] hover:text-[var(--accent)] transition-colors truncate block"
                      >
                        {order.item.title}
                      </Link>
                      <p className="text-[var(--accent)] font-bold text-xl mt-1 font-mono">
                        {Number(order.price).toLocaleString()}
                        <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {activeTab === 'buy' ? `卖家: ${order.seller?.nickname}` : `买家: ${order.buyer?.nickname}`}
                      </p>
                      <p className="text-sm text-[var(--text-subtle)]">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'PAID' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'CANCELED' ? 'bg-[var(--canvas)] text-[var(--text-muted)]' :
                      order.status === 'DISPUTED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]}
                    </span>

                    <div className="mt-4 space-y-2">
                      {activeTab === 'buy' && order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--canvas)] text-red-600 rounded-lg font-medium hover:bg-red-50 transition-all duration-150"
                        >
                          <XIcon />
                          取消订单
                        </button>
                      )}
                      {activeTab === 'buy' && order.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleConfirm(order.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-150 active:scale-[0.98]"
                        >
                          <CheckIcon />
                          确认收货
                        </button>
                      )}
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-2">
                          <TruckIcon />
                          <span>{order.logisticsCompany} - {order.trackingNumber}</span>
                        </div>
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
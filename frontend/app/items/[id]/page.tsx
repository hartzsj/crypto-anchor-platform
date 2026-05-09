'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { itemsApi, ordersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  location: string;
  serialNumber: string;
  seller: {
    id: string;
    username: string;
    nickname: string;
    reputation: number;
  };
  createdAt: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadItem();
  }, [params.id]);

  const loadItem = async () => {
    try {
      const response = await itemsApi.getOne(params.id as string);
      setItem(response.data);
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (item?.seller.id === user?.id) {
      alert('不能购买自己的物品');
      return;
    }

    if (!confirm(`确认以 ${item?.price} USDT 购买此物品？`)) {
      return;
    }

    setProcessing(true);
    try {
      const orderResponse = await ordersApi.create(item!.id);
      const orderId = orderResponse.data.id;
      await ordersApi.pay(orderId);
      alert('✅ 下单成功！等待卖家发货');
      router.push('/orders');
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '下单失败，请重试'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">物品不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Images */}
            <div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-96 rounded-2xl flex items-center justify-center mb-4">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-gray-400 text-8xl">📦</span>
                )}
              </div>
              {item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.images.slice(1, 5).map((img, idx) => (
                    <img key={idx} src={img} alt="" className="h-20 w-full object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900">{item.title}</h1>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                  <span className="text-gray-600">价格</span>
                  <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{item.price} USDT</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">分类</span>
                    <p className="font-semibold">{item.category}</p>
                  </div>
                  {item.location && (
                    <div>
                      <span className="text-gray-500 text-sm">所在地</span>
                      <p className="font-semibold">{item.location}</p>
                    </div>
                  )}
                </div>
                {item.serialNumber && (
                  <div>
                    <span className="text-gray-500 text-sm">序列号</span>
                    <p className="font-mono font-semibold">{item.serialNumber}</p>
                  </div>
                )}
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">{item.seller.nickname[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{item.seller.nickname}</p>
                    <p className="text-sm text-yellow-500">⭐ 信誉分: {item.seller.reputation}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  发布时间: {new Date(item.createdAt).toLocaleString('zh-CN')}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold mb-2 text-gray-900">物品描述</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={processing || item.seller.id === user?.id}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </span>
                  ) : item.seller.id === user?.id ? (
                    '这是你的物品'
                  ) : (
                    '立即购买'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

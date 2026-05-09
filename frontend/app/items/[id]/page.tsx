'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { itemsApi, ordersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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

// SVG Icons
const PackageIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1">
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40" />
  </svg>
);

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4l6 2 8 8-4 4-8-8-2-6z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2a6 6 0 00-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 00-6-6z" />
    <circle cx="10" cy="8" r="2" />
  </svg>
);

const HashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6h12M4 14h12M6 4v12M14 4v12" />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)">
    <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-2.5 2 .5-3.5L3.5 5l3.5-.5L8 1z" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2 12h13l3-8H6" />
  </svg>
);

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
      alert('下单成功，等待卖家发货');
      router.push('/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || '下单失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="skeleton w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-12 text-center">
          <PackageIcon />
          <p className="mt-6 text-[var(--text-muted)]">物品不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Images */}
            <div>
              <div className="bg-[var(--canvas)] h-96 rounded-2xl flex items-center justify-center mb-4">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <PackageIcon />
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
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">{item.title}</h1>

              {/* Price Card */}
              <div className="bg-[var(--accent-subtle)] p-6 rounded-2xl border border-[var(--accent-light)]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">价格</span>
                  <span className="text-3xl font-bold text-[var(--accent)] font-mono">
                    {Number(item.price).toLocaleString()}
                    <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
                  </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--canvas)] flex items-center justify-center text-[var(--text-muted)]">
                    <TagIcon />
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">分类</span>
                    <p className="font-medium text-[var(--text)]">{item.category}</p>
                  </div>
                </div>
                {item.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--canvas)] flex items-center justify-center text-[var(--text-muted)]">
                      <MapPinIcon />
                    </div>
                    <div>
                      <span className="text-sm text-[var(--text-muted)]">所在地</span>
                      <p className="font-medium text-[var(--text)]">{item.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {item.serialNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--canvas)] flex items-center justify-center text-[var(--text-muted)]">
                    <HashIcon />
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">序列号</span>
                    <p className="font-mono font-medium text-[var(--text)]">{item.serialNumber}</p>
                  </div>
                </div>
              )}

              {/* Seller Card */}
              <div className="bg-[var(--canvas)] p-4 rounded-xl border border-[var(--border)]">
                <div className="flex items-center gap-4">
                  <Link href={`/user/${item.seller.id}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <span className="text-white font-bold">{item.seller.nickname[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                        {item.seller.nickname}
                      </p>
                      <span className="flex items-center gap-1 text-sm text-[var(--accent)]">
                        <StarIcon />
                        <span className="font-mono">{item.seller.reputation}</span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="text-sm text-[var(--text-subtle)]">
                发布时间: {new Date(item.createdAt).toLocaleString('zh-CN')}
              </div>

              {/* Description */}
              <div className="border-t border-[var(--border)] pt-6">
                <h3 className="text-lg font-semibold text-[var(--text)] mb-3">物品描述</h3>
                <p className="text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">{item.description}</p>
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuy}
                disabled={processing || item.seller.id === user?.id}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--accent)] text-white rounded-xl font-semibold text-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-md)] transition-all duration-150 active:scale-[0.98]"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    处理中...
                  </span>
                ) : item.seller.id === user?.id ? (
                  '这是你的物品'
                ) : (
                  <>
                    <ShoppingCartIcon />
                    立即购买
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
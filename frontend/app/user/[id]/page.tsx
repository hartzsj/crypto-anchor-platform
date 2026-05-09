'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';

interface UserPublic {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  reputation: number;
  createdAt: string;
  stats: {
    itemsCount: number;
    buyOrdersCount: number;
    sellOrdersCount: number;
    avgRating: number;
    goodRate: number;
    reviewsReceivedCount: number;
  };
}

interface Item {
  id: string;
  title: string;
  images: string[];
  price: number;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
  order: {
    item: {
      id: string;
      title: string;
    };
  };
}

// SVG Icons
const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--accent)">
    <path d="M9 1l2 4 4.5.5-3 3 .5 4.5L9 11l-3 2 .5-4.5-3-3L7 5l2-4z" />
  </svg>
);

const EmptyPackageIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1">
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40" />
  </svg>
);

const EmptyCommentIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1">
    <rect x="8" y="12" width="48" height="36" rx="4" />
    <path d="M8 20h48M8 28h40M8 36h32" />
    <path d="M20 48l8 8 8-8" />
  </svg>
);

const UserNotFoundIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
    <circle cx="28" cy="20" r="12" />
    <path d="M8 52c0-12 10-20 20-20s20 8 20 20" />
    <path d="M44 44l8 8M52 44l-8 8" stroke="var(--accent)" strokeWidth="2" />
  </svg>
);

export default function UserPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserPublic | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'reviews'>('items');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, itemsRes, reviewsRes] = await Promise.all([
        usersApi.getPublicProfile(userId),
        usersApi.getUserItems(userId),
        usersApi.getUserReviews(userId),
      ]);
      setUser(userRes.data);
      setItems(itemsRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Failed to load user:', error);
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

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-12 text-center">
          <UserNotFoundIcon />
          <p className="mt-6 text-lg text-[var(--text-muted)]">用户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-md)]">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white text-3xl font-bold">{user.nickname?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">{user.nickname}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-[var(--accent)]">
                  <StarIcon />
                  <span className="font-semibold font-mono">{user.stats.avgRating}</span>
                </span>
                <span className="text-green-600 font-semibold">好评率 {user.stats.goodRate}%</span>
                <span className="text-sm text-[var(--text-muted)]">{user.stats.reviewsReceivedCount}评价</span>
              </div>
              <p className="text-[var(--text-subtle)] text-sm mt-2">
                已发布 {user.stats.itemsCount} 个物品 · 完成 {user.stats.buyOrdersCount + user.stats.sellOrdersCount} 次交易
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'items'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            发布的物品 ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 ${
              activeTab === 'reviews'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
            }`}
          >
            收到的评价 ({reviews.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'items' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <EmptyPackageIcon />
                <p className="mt-6 text-[var(--text-muted)]">该用户暂无发布的物品</p>
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
                        <EmptyPackageIcon />
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <EmptyCommentIcon />
                <p className="mt-6 text-[var(--text-muted)]">该用户暂无评价</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-[var(--canvas)] rounded-xl p-6 border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                          {review.reviewer.avatar ? (
                            <img src={review.reviewer.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-white font-bold">{review.reviewer.nickname?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/user/${review.reviewer.id}`}
                            className="font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                          >
                            {review.reviewer.nickname}
                          </Link>
                          <p className="text-xs text-[var(--text-muted)]">关于: {review.order.item.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--accent)]">
                        <StarIcon />
                        <span className="font-semibold font-mono">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-[var(--text)] bg-[var(--surface)] p-4 rounded-lg">{review.comment}</p>
                    )}
                    <p className="text-xs text-[var(--text-subtle)] mt-2">
                      {new Date(review.createdAt).toLocaleString('zh-CN')}
                    </p>
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
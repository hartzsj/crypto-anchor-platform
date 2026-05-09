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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-gray-500">用户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white text-3xl font-bold">{user.nickname?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.nickname}</h1>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-yellow-500">
                  <span className="text-xl mr-1">⭐</span>
                  <span className="font-semibold">{user.stats.avgRating}</span>
                </span>
                <span className="text-green-600 font-semibold">好评率 {user.stats.goodRate}%</span>
                <span className="text-gray-500 text-sm">{user.stats.reviewsReceivedCount}评价</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                已发布 {user.stats.itemsCount} 个物品 · 完成 {user.stats.buyOrdersCount + user.stats.sellOrdersCount} 次交易
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            发布的物品 ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            收到的评价 ({reviews.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'items' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500">该用户暂无发布的物品</p>
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500">该用户暂无评价</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                          {review.reviewer.avatar ? (
                            <img src={review.reviewer.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-white font-bold">{review.reviewer.nickname?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <Link href={`/user/${review.reviewer.id}`} className="font-semibold hover:text-indigo-600">
                            {review.reviewer.nickname}
                          </Link>
                          <p className="text-xs text-gray-500">关于: {review.order.item.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 bg-white p-4 rounded-lg">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['电子产品', '服装鞋帽', '家居用品', '运动户外', '图书文具', '其他'];

export default function CreateItemPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    serialNumber: '',
    imageUrls: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseFloat(form.price) <= 0) {
      setError('价格必须大于0');
      return;
    }

    if (!form.category) {
      setError('请选择分类');
      return;
    }

    setLoading(true);

    try {
      const images = form.imageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url);

      await itemsApi.create({
        title: form.title,
        description: form.description,
        images,
        price: parseFloat(form.price),
        category: form.category,
        location: form.location || undefined,
        serialNumber: form.serialNumber || undefined,
      });

      alert('✅ 物品发布成功！等待管理员审核后将在市场显示');
      router.push('/items');
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          发布物品
        </h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              物品标题 *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              placeholder="请输入物品标题"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              物品描述 *
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              placeholder="详细描述物品的成色、功能、使用情况..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                价格 (USDT) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                分类 *
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              >
                <option value="">选择分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                所在地
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                placeholder="例如: 北京市朝阳区"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                序列号（可选）
              </label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
                placeholder="高价值物品建议填写序列号"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              图片URL（每行一个）
            </label>
            <textarea
              value={form.imageUrls}
              onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
            <p className="text-sm text-gray-500 mt-2">请输入图片的完整URL，每行一个</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发布中...
                </span>
              ) : (
                '发布物品'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['电子产品', '服装鞋帽', '家居用品', '运动户外', '图书文具', '其他'];

// SVG Icons
const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M12 6v14M8 6l4 4 4-4" />
  </svg>
);

const TitleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6h12M4 10h12M4 14h8" />
  </svg>
);

const DescriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="14" height="14" rx="2" />
    <path d="M6 7h8M6 10h8M6 13h4" />
  </svg>
);

const PriceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 4v12M7 8h6M7 12h4" />
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

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="16" height="16" rx="2" />
    <circle cx="7" cy="7" r="2" />
    <path d="M18 14l-4-4-6 6" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--accent-light)">
    <path d="M10 2L2 18h16L10 2z" />
    <path d="M10 8v4M10 14v1" stroke="white" strokeWidth="2" />
  </svg>
);

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

      alert('物品发布成功，等待管理员审核后将在市场显示');
      router.push('/items');
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-[var(--shadow-md)]">
              <PackageIcon />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                发布物品
              </h1>
              <p className="mt-1 text-[var(--text-muted)]">将你的物品上架到市场</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[var(--accent-subtle)] border border-[var(--accent-light)] px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertIcon />
            <span className="text-[var(--accent)]">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8 space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text)]">物品标题 *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <TitleIcon />
              </div>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                placeholder="请输入物品标题"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text)]">物品描述 *</label>
            <div className="relative">
              <div className="absolute left-4 top-4 text-[var(--text-muted)]">
                <DescriptionIcon />
              </div>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                placeholder="详细描述物品的成色、功能、使用情况..."
              />
            </div>
          </div>

          {/* Price & Category */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">价格 (USDT) *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <PriceIcon />
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150 font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">分类 *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <TagIcon />
                </div>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                >
                  <option value="">选择分类</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location & Serial Number */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">所在地</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <MapPinIcon />
                </div>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="例如: 北京市朝阳区"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">序列号（可选）</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <HashIcon />
                </div>
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150 font-mono"
                  placeholder="高价值物品建议填写序列号"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text)]">图片URL（每行一个）</label>
            <div className="relative">
              <div className="absolute left-4 top-4 text-[var(--text-muted)]">
                <ImageIcon />
              </div>
              <textarea
                value={form.imageUrls}
                onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              />
            </div>
            <p className="text-sm text-[var(--text-muted)]">请输入图片的完整URL，每行一个</p>
          </div>

          {/* Submit Button */}
          <div className="border-t border-[var(--border)] pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-semibold text-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 shadow-[var(--shadow-md)] transition-all duration-150 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" />
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
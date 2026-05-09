'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// SVG Icons
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <path d="M2 6l8 5 8-5" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="9" width="14" height="10" rx="2" />
    <path d="M7 9V6a3 3 0 016 0v3" />
    <circle cx="10" cy="14" r="1" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--accent-light)">
    <path d="M10 2L2 18h16L10 2z" />
    <path d="M10 8v4M10 14v1" stroke="white" strokeWidth="2" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-[var(--canvas)]">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[var(--accent-subtle)] rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[var(--accent-subtle)] rounded-full blur-[80px] opacity-30" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-lg)] p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-md)]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--accent)" />
                <path d="M8 16L16 8L24 16L16 24L8 16Z" fill="white" />
                <circle cx="16" cy="16" r="4" fill="var(--accent)" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text)]">欢迎回来</h2>
            <p className="mt-2 text-[var(--text-muted)]">登录你的账户继续</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--accent-subtle)] border border-[var(--accent-light)] rounded-xl flex items-center gap-3">
              <AlertIcon />
              <span className="text-sm text-[var(--accent)]">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">
                邮箱
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <EmailIcon />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">
                密码
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="输入密码"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[var(--text-muted)]">
              还没有账户？{' '}
              <Link href="/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
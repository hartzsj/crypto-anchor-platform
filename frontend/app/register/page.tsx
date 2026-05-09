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

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="6" r="4" />
    <path d="M3 18c0-4 3.5-7 7-7s7 3 7 7" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--accent-light)">
    <path d="M10 2L2 18h16L10 2z" />
    <path d="M10 8v4M10 14v1" stroke="white" strokeWidth="2" />
  </svg>
);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      await register(email, username, password, nickname);
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-[var(--canvas)]">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--accent-subtle)] rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[var(--accent-subtle)] rounded-full blur-[80px] opacity-30" />
      </div>

      {/* Register Card */}
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
            <h2 className="text-2xl font-bold text-[var(--text)]">创建账户</h2>
            <p className="mt-2 text-[var(--text-muted)]">加入 CryptoAnchor 开始交易</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--accent-subtle)] border border-[var(--accent-light)] rounded-xl flex items-center gap-3">
              <AlertIcon />
              <span className="text-sm text-[var(--accent)]">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">邮箱</label>
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

            {/* Username & Nickname */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">用户名</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                    placeholder="唯一标识"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">昵称</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                    placeholder="显示名"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">密码</label>
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
                    placeholder="至少6位"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">确认密码</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                    placeholder="再次输入"
                  />
                </div>
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
                  注册中...
                </span>
              ) : (
                '立即注册'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[var(--text-muted)]">
              已有账户？{' '}
              <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
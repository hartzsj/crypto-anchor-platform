'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// SVG Icons
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="9" width="14" height="10" rx="2" />
    <path d="M7 9V6a3 3 0 016 0v3" />
    <circle cx="10" cy="14" r="1" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 10H4M10 16l-6-6 6-6" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2L2 18h16L10 2z" />
    <path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function ChangePasswordPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('新密码和确认密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      alert('新密码至少6位');
      return;
    }

    setSaving(true);
    try {
      await usersApi.changePassword(oldPassword, newPassword);
      alert('密码已修改，请重新登录');
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || '修改失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile/edit"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeftIcon />
            返回编辑资料
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            修改密码
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">更新你的账户密码</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Old Password */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">旧密码</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="输入当前密码"
                  minLength={6}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">新密码</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="输入新密码"
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">确认新密码</label>
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
                  placeholder="再次输入新密码"
                  minLength={6}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
              >
                {saving ? '修改中...' : '确认修改'}
              </button>
              <Link
                href="/profile/edit"
                className="px-6 py-3 bg-[var(--canvas)] text-[var(--text)] border border-[var(--border)] rounded-xl font-semibold hover:border-[var(--text-muted)] transition-all duration-150"
              >
                返回
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertIcon />
              <p className="text-sm text-yellow-800">
                修改密码后需要重新登录，请确保记住新密码
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
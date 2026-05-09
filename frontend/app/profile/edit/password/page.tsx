'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
      alert('❌ 新密码和确认密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      alert('❌ 新密码至少6位');
      return;
    }

    setSaving(true);
    try {
      await usersApi.changePassword(oldPassword, newPassword);
      alert('✅ 密码已修改！请重新登录');
      router.push('/login');
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '修改失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">修改密码</h1>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Old Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">旧密码</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="输入当前密码"
                minLength={6}
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">新密码</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="输入新密码"
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">确认新密码</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="再次输入新密码"
                minLength={6}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? '修改中...' : '确认修改'}
              </button>
              <Link
                href="/profile/edit"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                返回
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <p className="text-sm text-yellow-800">
              ⚠️ 修改密码后需要重新登录，请确保记住新密码
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
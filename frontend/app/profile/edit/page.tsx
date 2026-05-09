'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setNickname(user?.email?.split('@')[0] || '');
  }, [isAuthenticated, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateProfile({
        nickname,
        avatar: avatar || undefined,
      });
      alert('✅ 资料已更新！');
      router.push('/profile');
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '更新失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">编辑资料</h1>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">头像</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white text-2xl font-bold">{nickname?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入头像图片URL"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">支持 jpg、png 等图片链接</p>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">昵称</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="你的昵称"
                minLength={2}
                maxLength={20}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <Link
                href="/profile"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                取消
              </Link>
              <Link
                href="/profile/edit/password"
                className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200"
              >
                修改密码
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
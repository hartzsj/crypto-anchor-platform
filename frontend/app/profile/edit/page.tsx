'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// SVG Icons
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="6" r="4" />
    <path d="M3 18c0-4 3.5-7 7-7s7 3 7 7" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="16" height="16" rx="2" />
    <circle cx="7" cy="7" r="2" />
    <path d="M18 14l-4-4-6 6" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 10H4M10 16l-6-6 6-6" />
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="5" />
    <path d="M12 6l6 6v4h-4l-2-2" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4v12M8 8l4-4 4 4M4 20h16" />
  </svg>
);

export default function EditProfilePage() {
  const { user, isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      const response = await usersApi.getMe();
      const userData = response.data;
      setNickname(userData.nickname || userData.email?.split('@')[0] || '');
      setAvatar(userData.avatar || '');
      setBio(userData.bio || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await usersApi.updateProfile({
        nickname,
        avatar: avatar || undefined,
        bio: bio || undefined,
      });

      // 更新 localStorage 中的用户信息
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, nickname, avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // 更新 AuthContext
      if (user) {
        login(user.email, ''); // 这会触发重新获取用户信息
      }

      alert('资料已更新');
      router.push('/profile');
    } catch (err: any) {
      alert(err.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 转换为 base64（简单方案，实际生产环境应上传到服务器）
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="skeleton w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeftIcon />
            返回个人中心
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            编辑资料
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">更新你的个人信息</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text)]">头像</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-md)] overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-bold">{nickname?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {/* 上传按钮 */}
                  <label className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium cursor-pointer hover:bg-[var(--accent-hover)] transition-all duration-150">
                    <UploadIcon />
                    上传图片
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* URL 输入 */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <ImageIcon />
                    </div>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                      placeholder="或输入头像图片URL"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-subtle)]">支持 jpg、png 格式，建议尺寸 200x200，最大 2MB</p>
                </div>
              </div>
            </div>

            {/* Nickname */}
            <div className="space-y-3">
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
                  placeholder="你的昵称"
                  minLength={2}
                  maxLength={20}
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
                {saving ? '保存中...' : '保存'}
              </button>
              <Link
                href="/profile"
                className="px-6 py-3 bg-[var(--canvas)] text-[var(--text)] border border-[var(--border)] rounded-xl font-semibold hover:border-[var(--text-muted)] transition-all duration-150"
              >
                取消
              </Link>
              <Link
                href="/profile/edit/password"
                className="flex items-center gap-2 px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200 transition-all duration-150"
              >
                <KeyIcon />
                修改密码
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
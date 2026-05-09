'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 判断链接是否活跃
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/items') {
      // 物品市场：匹配 /items 或 /items/xxx（物品详情页），但不匹配 /items/create
      return pathname === '/items' || (pathname.startsWith('/items/') && !pathname.startsWith('/items/create'));
    }
    return pathname.startsWith(path);
  };

  // 链接样式
  const linkClass = (path: string) =>
    `px-4 py-2 font-medium rounded-lg transition-all ${
      isActive(path)
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
        : 'text-gray-700 hover:text-indigo-600 hover:bg-white/50'
    }`;

  return (
    <nav className={`fixed top-0 left-0 right-0 transition-all duration-300 z-50 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg' : 'bg-white/60 backdrop-blur-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🔗</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CryptoAnchor
              </span>
            </Link>
            <div className="ml-10 hidden md:flex items-center space-x-1">
              <Link href="/" className={linkClass('/')}>
                首页
              </Link>
              <Link href="/items" className={linkClass('/items')}>
                物品市场
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/items/create" className={linkClass('/items/create')}>
                    发布物品
                  </Link>
                  <Link href="/orders" className={linkClass('/orders')}>
                    我的订单
                  </Link>
                  <Link href="/wallet" className={linkClass('/wallet')}>
                    钱包
                  </Link>
                  <Link href="/profile" className={linkClass('/profile')}>
                    个人中心
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" className={`px-4 py-2 font-medium rounded-lg transition-all ${
                      isActive('/admin')
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/50'
                    }`}>
                      管理后台
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{user?.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className={`px-4 py-2 font-medium transition-all ${
                  isActive('/login') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                }`}>
                  登录
                </Link>
                <Link
                  href="/register"
                  className={`px-5 py-2 font-medium shadow-lg hover:shadow-xl transition-all ${
                    isActive('/register')
                      ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  注册
                </Link>
              </div>
            )}
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className={`block px-4 py-2 rounded-lg ${
              isActive('/') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
            }`}>首页</Link>
            <Link href="/items" className={`block px-4 py-2 rounded-lg ${
              isActive('/items') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
            }`}>物品市场</Link>
            {isAuthenticated && (
              <>
                <Link href="/items/create" className={`block px-4 py-2 rounded-lg ${
                  isActive('/items/create') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}>发布物品</Link>
                <Link href="/orders" className={`block px-4 py-2 rounded-lg ${
                  isActive('/orders') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}>我的订单</Link>
                <Link href="/wallet" className={`block px-4 py-2 rounded-lg ${
                  isActive('/wallet') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}>钱包</Link>
                <Link href="/profile" className={`block px-4 py-2 rounded-lg ${
                  isActive('/profile') ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}>个人中心</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

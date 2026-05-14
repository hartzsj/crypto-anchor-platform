'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

// SVG Icons
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M8 16L16 8L24 16L16 24L8 16Z" fill="white" />
    <circle cx="16" cy="16" r="4" fill="var(--accent)" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="6" r="4" />
    <path d="M3 18c0-4 3.5-7 7-7s7 3 7 7" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2H4a2 2 0 00-2 2v10a2 2 0 002 2h2M12 2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2M7 9h8M11 6l3 3-3 3" />
  </svg>
);

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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/items') {
      return pathname === '/items' || (pathname.startsWith('/items/') && !pathname.startsWith('/items/create'));
    }
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `px-4 py-2 font-medium rounded-lg transition-all duration-150 ${
      isActive(path)
        ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
    }`;

  return (
    <nav className={`fixed top-0 left-0 right-0 transition-all duration-300 z-50 ${
      scrolled
        ? 'bg-[var(--surface)]/95 backdrop-blur-sm shadow-[var(--shadow-sm)] border-b border-[var(--border-subtle)]'
        : 'bg-[var(--surface)]/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <LogoIcon />
              <span className="text-lg font-semibold tracking-tight text-[var(--text)]">
                CryptoAnchor
              </span>
            </Link>

            <div className="ml-10 hidden md:flex items-center gap-1">
              <Link href="/" className={linkClass('/')}>
                首页
              </Link>
              <Link href="/items" className={linkClass('/items')}>
                物品市场
              </Link>
              <Link href="/market" className={linkClass('/market')}>
                行情中心
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
                    <Link href="/admin" className={`px-4 py-2 font-medium rounded-lg transition-all duration-150 ${
                      isActive('/admin')
                        ? 'text-[var(--accent-light)] bg-[var(--accent-subtle)]'
                        : 'text-[var(--accent-light)] hover:bg-[var(--accent-subtle)]'
                    }`}>
                      管理后台
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-[var(--surface-hover)] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[var(--accent)]">
                      {user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-muted)]">
                    {user?.email}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent-light)] transition-all duration-150"
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className={`px-4 py-2 font-medium transition-all duration-150 ${
                  isActive('/login')
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}>
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-all duration-150 active:scale-[0.98]"
                >
                  注册
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-b border-[var(--border)] shadow-[var(--shadow-md)]">
          <div className="px-4 py-4 space-y-1">
            <Link href="/" className={`block px-4 py-3 rounded-lg ${
              isActive('/') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
            }`}>
              首页
            </Link>
            <Link href="/items" className={`block px-4 py-3 rounded-lg ${
              isActive('/items') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
            }`}>
              物品市场
            </Link>
            <Link href="/market" className={`block px-4 py-3 rounded-lg ${
              isActive('/market') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
            }`}>
              行情中心
            </Link>

            {isAuthenticated && (
              <>
                <div className="h-px bg-[var(--border)] my-2" />
                <Link href="/items/create" className={`block px-4 py-3 rounded-lg ${
                  isActive('/items/create') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  发布物品
                </Link>
                <Link href="/orders" className={`block px-4 py-3 rounded-lg ${
                  isActive('/orders') ? 'bg-[var(--accent-suble)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  我的订单
                </Link>
                <Link href="/wallet" className={`block px-4 py-3 rounded-lg ${
                  isActive('/wallet') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  钱包
                </Link>
                <Link href="/profile" className={`block px-4 py-3 rounded-lg ${
                  isActive('/profile') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  个人中心
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" className={`block px-4 py-3 rounded-lg ${
                    isActive('/admin') ? 'bg-[var(--accent-subtle)] text-[var(--accent-light)]' : 'text-[var(--accent-light)] hover:bg-[var(--accent-subtle)]'
                  }`}>
                    管理后台
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';

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

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

// Dropdown Component
function Dropdown({ trigger, children, align = 'left' }: { trigger: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {trigger}
      {isOpen && (
        <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-md)] min-w-[140px] z-50`}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-sm transition-colors ${
        active
          ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      {children}
    </Link>
  );
}

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
          {/* Left: Logo + Menu */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <LogoIcon />
              <span className="text-lg font-semibold tracking-tight text-[var(--text)]">
                CryptoAnchor
              </span>
            </Link>

            <div className="ml-8 hidden md:flex items-center gap-1">
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
                  <Link href="/wallet" className={linkClass('/wallet')}>
                    钱包
                  </Link>
                  <Link href="/orders" className={linkClass('/orders')}>
                    我的订单
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User Dropdown */}
                <Dropdown
                  align="right"
                  trigger={
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-hover)] rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
                        <span className="text-sm font-semibold text-[var(--accent)]">
                          {user?.email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--text-muted)] hidden sm:inline">
                        {user?.email}
                      </span>
                      <ChevronDownIcon />
                    </div>
                  }
                >
                  {user?.role === 'ADMIN' && (
                    <DropdownItem href="/admin" active={isActive('/admin')}>
                      管理后台
                    </DropdownItem>
                  )}
                  <DropdownItem href="/profile" active={isActive('/profile')}>
                    个人中心
                  </DropdownItem>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    退出登录
                  </button>
                </Dropdown>
              </>
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

            {/* Mobile Menu Button */}
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
                <Link href="/wallet" className={`block px-4 py-3 rounded-lg ${
                  isActive('/wallet') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  钱包
                </Link>
                <Link href="/orders" className={`block px-4 py-3 rounded-lg ${
                  isActive('/orders') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  我的订单
                </Link>
                <div className="h-px bg-[var(--border)] my-2" />
                <Link href="/profile" className={`block px-4 py-3 rounded-lg ${
                  isActive('/profile') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}>
                  个人中心
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" className={`block px-4 py-3 rounded-lg ${
                    isActive('/admin') ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                  }`}>
                    管理后台
                  </Link>
                )}
                <div className="h-px bg-[var(--border)] my-2" />
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-3 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-hover)]"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
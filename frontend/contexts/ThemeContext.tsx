'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题配置
export const THEMES = {
  rose: {
    name: '深玫瑰',
    nameEn: 'Deep Rose',
    accent: '#BE185D',
    accentHover: '#9F1239',
    accentLight: '#F43F5E',
    accentSubtle: '#FEE2E2',
    preview: 'bg-[#BE185D]',
  },
  ocean: {
    name: '海洋蓝',
    nameEn: 'Ocean Blue',
    accent: '#0369A1',
    accentHover: '#075985',
    accentLight: '#0EA5E9',
    accentSubtle: '#E0F2FE',
    preview: 'bg-[#0369A1]',
  },
  emerald: {
    name: '翡翠绿',
    nameEn: 'Emerald Green',
    accent: '#059669',
    accentHover: '#047857',
    accentLight: '#10B981',
    accentSubtle: '#D1FAE5',
    preview: 'bg-[#059669]',
  },
  sunset: {
    name: '日落橙',
    nameEn: 'Sunset Orange',
    accent: '#EA580C',
    accentHover: '#C2410C',
    accentLight: '#F97316',
    accentSubtle: '#FED7AA',
    preview: 'bg-[#EA580C]',
  },
  violet: {
    name: '紫罗兰',
    nameEn: 'Violet Purple',
    accent: '#7C3AED',
    accentHover: '#6D28D9',
    accentLight: '#8B5CF6',
    accentSubtle: '#EDE9FE',
    preview: 'bg-[#7C3AED]',
  },
  midnight: {
    name: '午夜黑',
    nameEn: 'Midnight Black',
    accent: '#3F3F46',  // 稍亮的灰色，避免和 text (#18181B) 冲突
    accentHover: '#27272A',
    accentLight: '#52525B',
    accentSubtle: '#E4E4E7',  // 保持浅色，确保 accent 文字可见
    preview: 'bg-[#3F3F46]',
  },
  gold: {
    name: '金琥珀',
    nameEn: 'Golden Amber',
    accent: '#D97706',
    accentHover: '#B45309',
    accentLight: '#F59E0B',
    accentSubtle: '#FEF3C7',
    preview: 'bg-[#D97706]',
  },
  teal: {
    name: '青碧',
    nameEn: 'Teal Cyan',
    accent: '#0D9488',
    accentHover: '#0F766E',
    accentLight: '#14B8A6',
    accentSubtle: '#CCFBF1',
    preview: 'bg-[#0D9488]',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  themeConfig: typeof THEMES[ThemeKey];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('ocean');

  useEffect(() => {
    // 从 localStorage 恢复主题
    try {
      const storedTheme = localStorage.getItem('theme') as ThemeKey;
      if (storedTheme && THEMES[storedTheme]) {
        setThemeState(storedTheme);
        applyTheme(storedTheme);
      }
    } catch (e) {
      console.error('Failed to restore theme:', e);
    }
  }, []);

  const applyTheme = (themeKey: ThemeKey) => {
    const config = THEMES[themeKey];
    const root = document.documentElement;
    root.style.setProperty('--accent', config.accent);
    root.style.setProperty('--accent-hover', config.accentHover);
    root.style.setProperty('--accent-light', config.accentLight);
    root.style.setProperty('--accent-subtle', config.accentSubtle);
  };

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 导出所有主题供组件使用
export { THEMES as allThemes };
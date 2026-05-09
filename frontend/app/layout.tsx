import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "CryptoAnchor - 数字货币实物锚定交易平台",
  description: "使用数字货币交易和锚定现实物品的平台",
};

// 主题初始化脚本 - 防止页面闪烁
const themeInitScript = `
(function() {
  const themes = {
    rose: { accent: '#BE185D', accentHover: '#9F1239', accentLight: '#F43F5E', accentSubtle: '#FEE2E2' },
    ocean: { accent: '#0369A1', accentHover: '#075985', accentLight: '#0EA5E9', accentSubtle: '#E0F2FE' },
    emerald: { accent: '#059669', accentHover: '#047857', accentLight: '#10B981', accentSubtle: '#D1FAE5' },
    sunset: { accent: '#EA580C', accentHover: '#C2410C', accentLight: '#F97316', accentSubtle: '#FED7AA' },
    violet: { accent: '#7C3AED', accentHover: '#6D28D9', accentLight: '#8B5CF6', accentSubtle: '#EDE9FE' },
    midnight: { accent: '#3F3F46', accentHover: '#27272A', accentLight: '#52525B', accentSubtle: '#E4E4E7' },
    gold: { accent: '#D97706', accentHover: '#B45309', accentLight: '#F59E0B', accentSubtle: '#FEF3C7' },
    teal: { accent: '#0D9488', accentHover: '#0F766E', accentLight: '#14B8A6', accentSubtle: '#CCFBF1' }
  };

  try {
    const stored = localStorage.getItem('theme') || 'ocean';
    const config = themes[stored] || themes.ocean;
    const root = document.documentElement;
    root.style.setProperty('--accent', config.accent);
    root.style.setProperty('--accent-hover', config.accentHover);
    root.style.setProperty('--accent-light', config.accentLight);
    root.style.setProperty('--accent-subtle', config.accentSubtle);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
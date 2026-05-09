'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-[100dvh] bg-[var(--canvas)]">
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
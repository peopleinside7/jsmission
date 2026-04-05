'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import TabBar from '@/components/layout/TabBar';
import Toast from '@/components/ui/Toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const data = await meRes.json();
        setUser(data.user);
        return true;
      }
      // Try refresh token
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        const meRes2 = await fetch('/api/auth/me');
        if (meRes2.ok) {
          const data = await meRes2.json();
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [setUser]);

  useEffect(() => {
    fetch('/api/init')
      .catch(() => {})
      .finally(async () => {
        const authed = await checkAuth();
        if (!authed) {
          router.replace('/login');
        } else {
          setInitialized(true);
        }
      });

    // Auto refresh token every 25 minutes
    const interval = setInterval(() => {
      fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
    }, 25 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAuth, router]);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#999]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-[640px] mx-auto relative">
        {children}
      </div>
      <TabBar />
      <Toast />
    </div>
  );
}

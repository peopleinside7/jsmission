'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import TabBar from '@/components/layout/TabBar';
import Toast from '@/components/ui/Toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Init DB
    fetch('/api/init').then(() => {
      // Check auth
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setUser(data.user);
          setInitialized(true);
        })
        .catch(() => {
          router.replace('/login');
        });
    });
  }, []);

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

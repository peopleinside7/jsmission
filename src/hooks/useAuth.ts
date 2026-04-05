'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const { user, isLoading, setUser, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
    router.replace('/login');
  };

  return { user, isLoading, handleLogout };
}

export function useRequireAdmin() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/home');
    }
  }, [user, router]);

  return { user, isAdmin: user?.role === 'ADMIN' };
}

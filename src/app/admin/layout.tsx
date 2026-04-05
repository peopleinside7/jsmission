'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/clubs', icon: Users, label: '동아리 관리' },
  { href: '/admin/boards', icon: BookOpen, label: '게시판 관리' },
  { href: '/admin/users', icon: Users, label: '회원 관리' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch('/api/init').then(() => {
      fetch('/api/auth/me')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          if (data.user.role !== 'ADMIN') {
            router.replace('/home');
            return;
          }
          setUser(data.user);
          setInitialized(true);
        })
        .catch(() => {
          // Try token refresh before redirecting to login
          fetch('/api/auth/refresh', { method: 'POST' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(() => fetch('/api/auth/me'))
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
              if (data.user.role !== 'ADMIN') {
                router.replace('/home');
                return;
              }
              setUser(data.user);
              setInitialized(true);
            })
            .catch(() => router.replace('/login'));
        });
    }).catch(() => router.replace('/login'));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-12 h-12 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Desktop Guard */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-8 w-full">
        <div className="text-center">
          <Image src="/logo_r.png" alt="JS MISSION" width={80} height={80} className="mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">PC에서 이용해주세요</h2>
          <p className="text-sm text-[#999]">관리자 페이지는 1024px 이상의 화면에서 이용 가능합니다</p>
          <Link href="/home" className="btn-primary inline-block mt-4">모바일 홈으로</Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1E5631] text-white flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/10">
          <Image src="/logo_h.png" alt="JS MISSION" width={140} height={40} className="brightness-0 invert" />
          <p className="text-xs text-white/60 mt-2">관리자 패널</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${pathname === item.href ? 'bg-white/15 font-semibold' : 'hover:bg-white/10 text-white/80'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">{user?.name[0]}</div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-white/60">{user?.phone}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="hidden lg:block flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

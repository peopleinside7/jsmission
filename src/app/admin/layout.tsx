'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Menu, X, MessageSquare, Bell, Image as ImageIcon, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/clubs', icon: Users, label: '동아리 관리' },
  { href: '/admin/boards', icon: BookOpen, label: '게시판 관리' },
  { href: '/admin/users', icon: Users, label: '회원 관리' },
  { href: '/admin/feedback', icon: MessageSquare, label: '피드백 관리' },
  { href: '/admin/notifications', icon: Bell, label: '알림 관리' },
  { href: '/admin/content', icon: ImageIcon, label: '콘텐츠 관리' },
  { href: '/admin/stats', icon: BarChart3, label: '통계' },
  { href: '/admin/settings', icon: Settings, label: '설정' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/init').then(() => {
      fetch('/api/auth/me')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          if (data.user.role !== 'ADMIN') { router.replace('/home'); return; }
          setUser(data.user);
          setInitialized(true);
        })
        .catch(() => {
          fetch('/api/auth/refresh', { method: 'POST' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(() => fetch('/api/auth/me'))
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
              if (data.user.role !== 'ADMIN') { router.replace('/home'); return; }
              setUser(data.user);
              setInitialized(true);
            })
            .catch(() => router.replace('/login'));
        });
    }).catch(() => router.replace('/login'));
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-12 h-12 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" />
      </div>
    );
  }

  const Sidebar = () => (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/home" title="사용자 페이지로 이동" className="hover:opacity-80 transition-opacity">
          <Image src="/logo_header.jpg" alt="JS MISSION" width={120} height={30} className="h-[28px] w-auto" />
          <p className="text-xs text-white/60 mt-1">관리자 패널</p>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60"><X className="w-5 h-5" /></button>
      </div>
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${pathname === item.href ? 'bg-white/15 font-semibold' : 'hover:bg-white/10 text-white/80'}`}
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 모바일 헤더 */}
      <div className="lg:hidden bg-[#1E5631] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6 text-white" /></button>
        <Link href="/home" title="사용자 페이지로 이동">
          <Image src="/logo_header.jpg" alt="JS MISSION" width={100} height={24} className="h-[22px] w-auto" />
        </Link>
        <Link href="/home" className="text-white/80 text-xs">홈</Link>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1E5631] text-white flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* PC 사이드바 */}
      <aside className="hidden lg:flex w-64 bg-[#1E5631] text-white flex-col fixed h-full z-50">
        <Sidebar />
      </aside>

      {/* Main Content - 반응형 */}
      <main className="lg:ml-64 p-4 lg:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

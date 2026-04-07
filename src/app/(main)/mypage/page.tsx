'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import {
  Settings, LogOut, ChevronUp, ChevronDown, ExternalLink, X
} from 'lucide-react';

const menuSections = [
  {
    key: 'mission',
    label: '선교',
    items: [
      { label: '선교동아리', href: '/clubs' },
      { label: '선교일지', href: '/mission' },
      { label: '신입생상황', href: '/newcomers' },
    ]
  },
  {
    key: 'boards',
    label: '게시판',
    items: [
      { label: '공지사항', href: '/boards/NOTICE' },
      { label: '생명의 말씀', href: '/boards/SERMON' },
      { label: '자유게시판', href: '/boards/FREE' },
    ]
  },
  {
    key: 'community',
    label: '커뮤니티',
    items: [
      { label: 'Feedback', href: '/feedback' },
      { label: '자료실', href: '/resources' },
    ]
  },
  {
    key: 'mypage',
    label: '마이페이지',
    items: [
      { label: '내 정보 관리', href: '/settings' },
      { label: '비밀번호 변경', href: '/settings' },
    ]
  },
];

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  // 최초 전체 펼침
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(menuSections.map(s => [s.key, true]))
  );

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
    fetch('/api/clubs').then(r => r.json()).then(d => {
      setMyClubs(d.clubs || []);
    }).catch(() => {});
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
    router.replace('/login');
  };

  return (
    <div className="pb-24 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-base font-bold text-white">전체메뉴</h1>
        <div className="flex items-center gap-3">
          <Link href="/settings"><Settings className="w-5 h-5 text-white/80" /></Link>
          <button onClick={() => router.back()}><X className="w-5 h-5 text-white/80" /></button>
          <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl p-5 mb-3 border border-[#EEE]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#E8F5E9] rounded-full flex items-center justify-center shrink-0">
              <Image src="/logo_r.png" alt="profile" width={40} height={40} className="rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-[#1A1A1A]">{user?.name}</p>
              <p className="text-xs text-[#999]">{user?.phone}</p>
              <p className="text-xs text-[#4CAF50] mt-0.5">
                {user?.role === 'ADMIN' ? '관리자' : user?.role === 'CLUB_ADMIN' ? '동아리 관리자' : '일반 회원'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="block bg-[#1E5631] rounded-2xl p-4 mb-4 text-white">
            <p className="text-sm font-semibold">Admin 대시보드</p>
            <p className="text-xs text-white/70">PC에서 접속해주세요</p>
          </Link>
        )}

        {/* Menu Sections - 2열 그리드, 접기/펴기 */}
        {menuSections.map(section => (
          <div key={section.key} className="bg-white rounded-2xl mb-3 border border-[#EEE] overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full px-5 py-4 flex items-center justify-between"
            >
              <h3 className="text-base font-bold text-[#1A1A1A]">{section.label}</h3>
              {openSections[section.key]
                ? <ChevronUp className="w-5 h-5 text-[#999]" />
                : <ChevronDown className="w-5 h-5 text-[#999]" />
              }
            </button>

            {/* Section Items - 2열 그리드 */}
            {openSections[section.key] && (
              <div className="px-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#F5F5F5] pt-3">
                {section.items.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[#555] py-1.5 hover:text-[#1E5631] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Family Site */}
        <div className="bg-white rounded-2xl mb-3 border border-[#EEE] overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Family Site
            </h3>
          </div>
          <div className="px-5 pb-4 border-t border-[#F5F5F5] pt-3 space-y-2">
            <a href="https://www.example.com" target="_blank" rel="noopener"
              className="flex items-center gap-2 text-sm text-[#555] py-1">
              ⛪ 안산주성령교회 <ExternalLink className="w-3 h-3 text-[#BDBDBD]" />
            </a>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full bg-white rounded-2xl p-4 mb-4 border border-[#EEE] flex items-center gap-3 text-[#E53935]">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>

        {/* Footer */}
        <div className="text-center py-6 text-[10px] text-[#BDBDBD] space-y-1">
          <p>안산주성령교회 문화선교 플랫폼</p>
          <p>Developed by Praise Hong</p>
          <p>https://jsmission.vercel.app</p>
          <p className="mt-2 text-[#D0D0D0]">COPYRIGHT &copy; 2025 JS MISSION. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}

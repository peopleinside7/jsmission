'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Bell, Settings, LogOut, ChevronRight, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, Heart, FileText, ExternalLink
} from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sites, setSites] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // fetch family sites
    fetch('/api/boards/NOTICE').catch(() => {});
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.replace('/login');
  };

  const menuSections = [
    {
      key: 'boards',
      label: '게시판',
      icon: BookOpen,
      items: [
        { label: '공지사항', href: '/boards/NOTICE' },
        { label: '생명의 말씀', href: '/boards/SERMON' },
        { label: '자유게시판', href: '/boards/FREE' },
      ]
    },
    {
      key: 'mission',
      label: '선교',
      icon: Heart,
      items: [
        { label: '선교 일지', href: '/mission' },
        { label: '신입생 상황', href: '/newcomers' },
        { label: '선교동아리', href: '/clubs' },
      ]
    },
    {
      key: 'etc',
      label: '기타',
      icon: FileText,
      items: [
        { label: '자료실', href: '/resources' },
        { label: 'Feedback', href: '/feedback' },
      ]
    },
  ];

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-4">
        <h1 className="text-lg font-bold text-white">전체메뉴</h1>
      </div>

      <div className="page-container pt-4">
        {/* Profile Card */}
        <div className="card p-5 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center">
            <Image src="/logo_r.png" alt="profile" width={48} height={48} className="rounded-full" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-[#1A1A1A]">{user?.name}</p>
            <p className="text-xs text-[#999]">{user?.phone}</p>
            <p className="text-xs text-[#4CAF50] mt-0.5">{user?.role === 'ADMIN' ? '관리자' : user?.role === 'CLUB_ADMIN' ? '동아리 관리자' : '일반 회원'}</p>
          </div>
          <Link href="/settings"><Settings className="w-5 h-5 text-[#999]" /></Link>
        </div>

        {/* Admin Link */}
        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="card p-4 mb-4 flex items-center gap-3 block">
            <div className="w-10 h-10 bg-[#1E5631] rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Admin 대시보드</p>
              <p className="text-xs text-[#999]">PC에서 접속해주세요</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#BDBDBD]" />
          </Link>
        )}

        {/* Accordion Menus */}
        {menuSections.map(section => (
          <div key={section.key} className="card mb-2 overflow-hidden">
            <button onClick={() => toggleSection(section.key)} className="w-full p-4 flex items-center gap-3">
              <section.icon className="w-5 h-5 text-[#1E5631]" />
              <span className="text-sm font-semibold flex-1 text-left">{section.label}</span>
              {openSections[section.key] ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
            </button>
            {openSections[section.key] && (
              <div className="border-t border-[#F5F5F5]">
                {section.items.map(item => (
                  <Link key={item.href} href={item.href} className="px-4 py-3 pl-12 flex items-center text-sm text-[#666] hover:bg-[#F7F7F7]">
                    {item.label}
                    <ChevronRight className="w-4 h-4 text-[#BDBDBD] ml-auto" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Family Sites */}
        <div className="card mb-4 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-[#1E5631]" />
            Family Site
          </h3>
          <div className="space-y-2">
            <a href="https://www.example.com" target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-[#666] py-1">
              ⛪ 안산주성령교회 <ExternalLink className="w-3 h-3 text-[#BDBDBD]" />
            </a>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full card p-4 flex items-center gap-3 text-[#E53935]">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

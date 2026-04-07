'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Menu, ChevronRight } from 'lucide-react';

const CATEGORY_CHIPS = [
  { label: '선교동아리', href: '/clubs' },
  { label: '선교일지', href: '/mission' },
  { label: '신입생상황', href: '/newcomers' },
  { label: '자유게시판', href: '/boards/FREE' },
  { label: '생명의 말씀', href: '/boards/SERMON' },
  { label: '자료실', href: '/resources' },
];

const QUICK_MENUS = [
  { icon: '📢', label: '공지사항', href: '/boards/NOTICE' },
  { icon: '🏠', label: '선교동아리', href: '/clubs' },
  { icon: '📓', label: '선교 일지', href: '/mission' },
  { icon: '👥', label: '신입생상황', href: '/newcomers' },
  { icon: '📖', label: '생명의 말씀', href: '/boards/SERMON' },
  { icon: '💬', label: '자유게시판', href: '/boards/FREE' },
  { icon: '📁', label: '자료실', href: '/resources' },
  { icon: '💡', label: 'Feedback', href: '/feedback' },
  { icon: '🔗', label: 'Family Site', href: '/mypage' },
];

interface ClubData {
  id: number; name: string; icon: string; icon_color: string;
  slogan: string; category: string; recruitment_status: string;
  member_count: number; poster_image?: string;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [activeChip, setActiveChip] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => setClubs(d.clubs || [])).catch(() => {});
    fetch('/api/boards/NOTICE').then(r => r.json()).then(d => setNotices((d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="pb-24">
      {/* ── 1. Header: 녹색 배경 + SVG 독수리 로고 + JS MISSION + 사용자명 + 알림 + 메뉴 ── */}
      <div className="bg-[#1E5631] px-4 pt-3 pb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[640px] mx-auto">
          {/* 로고: SVG 독수리 + JS MISSION 텍스트 */}
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4C16 8 10 12 8 18C6 24 10 30 16 32C12 28 12 22 14 18C16 14 20 10 20 4Z" fill="white" opacity="0.9"/>
              <path d="M20 4C24 8 30 12 32 18C34 24 30 30 24 32C28 28 28 22 26 18C24 14 20 10 20 4Z" fill="white" opacity="0.7"/>
              <path d="M20 8C18 14 14 18 12 22C10 26 12 30 16 32L20 28L24 32C28 30 30 26 28 22C26 18 22 14 20 8Z" fill="white" opacity="0.5"/>
            </svg>
            <span className="text-white font-bold text-lg tracking-wide">JS MISSION</span>
          </div>
          {/* 우측: 사용자명 + 알림 + 메뉴 */}
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-xs font-medium">{user?.name} 회원님</span>
            <Link href="/mypage" className="relative">
              <Bell className="w-5 h-5 text-white/90" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E53935] rounded-full" />
            </Link>
            <Link href="/mypage">
              <Menu className="w-5 h-5 text-white/90" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto">
        {/* ── 2. Category Chips ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_CHIPS.map((chip, i) => (
              <Link
                key={chip.href}
                href={chip.href}
                onMouseEnter={() => setActiveChip(i)}
                onMouseLeave={() => setActiveChip(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0
                  ${activeChip === i
                    ? 'bg-[#1E5631] text-white shadow-md'
                    : 'bg-white text-[#666] border border-[#E0E0E0]'
                  }`}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── 3. 동아리 포스터: 밝은 보라색 카드 + 2열 좌우 스크롤 ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-bold text-[#1A1A1A]">선교동아리</h2>
            <Link href="/clubs" className="text-xs text-[#999] flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 2열(상하) x 좌우 스크롤 */}
          <div className="pl-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2 pr-4" style={{ width: 'max-content' }}>
              {Array.from({ length: Math.ceil(clubs.length / 2) }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-3 shrink-0" style={{ width: '165px' }}>
                  {[clubs[colIdx * 2], clubs[colIdx * 2 + 1]].filter(Boolean).map(club => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.id}`}
                      className="rounded-2xl overflow-hidden hover:shadow-md transition-shadow border border-[#E0E0E0] bg-[#F5F5F5]"
                    >
                      {/* 포스터: 패딩 여백 + 라운드 */}
                      <div className="p-2.5">
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F8F8F8] border border-[#E5E5E5]">
                          {club.poster_image ? (
                            <Image
                              src={club.poster_image}
                              alt={club.name}
                              fill
                              className="object-cover"
                              sizes="160px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: club.icon_color }}>
                              <span className="text-3xl">{club.icon}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* 하단 정보 */}
                      <div className="px-2.5 pb-2.5">
                        <p className="text-xs font-bold text-[#333] truncate">{club.name}</p>
                        <p className="text-[10px] text-[#888] mt-0.5 truncate">{club.slogan}</p>
                        <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium ${
                          club.recruitment_status === 'OPEN'
                            ? 'bg-[#E8F5E9] text-[#1E5631]'
                            : 'bg-gray-200 text-[#999]'
                        }`}>
                          {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Menu Grid ── */}
        <div className="px-4 mb-5">
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_MENUS.map(menu => (
              <Link
                key={menu.href + menu.label}
                href={menu.href}
                className="bg-white rounded-xl p-3.5 text-center border border-[#EEE] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-1.5">{menu.icon}</div>
                <p className="text-xs font-medium text-[#333]">{menu.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Notices ── */}
        {notices.length > 0 && (
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#1A1A1A]">공지사항</h2>
              <Link href="/boards/NOTICE" className="text-xs text-[#999] flex items-center gap-0.5">
                더보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-[#EEE] shadow-sm divide-y divide-[#F5F5F5]">
              {notices.map(n => (
                <Link key={n.id} href={`/boards/NOTICE/${n.id}`} className="flex items-center px-4 py-3">
                  <span className="text-sm text-[#333] flex-1 truncate">{n.title}</span>
                  <ChevronRight className="w-4 h-4 text-[#BDBDBD] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Menu, ChevronRight, ChevronLeft } from 'lucide-react';

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
  member_count: number; schedule_text: string; poster_image?: string;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => setClubs(d.clubs || [])).catch(() => {});
    fetch('/api/boards/NOTICE').then(r => r.json()).then(d => setNotices((d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 280;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="pb-24">
      {/* ── Header (1, 7, 8) ── */}
      <div className="bg-[#1E5631] px-4 pt-3 pb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[640px] mx-auto">
          <div className="flex items-center gap-2">
            <Image src="/logo_h.png" alt="JS MISSION" width={110} height={32} className="brightness-0 invert" />
          </div>
          <div className="flex items-center gap-3">
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
        {/* ── Category Chips (2) ── */}
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

        {/* ── Welcome ── */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl p-4 border border-[#EEE] shadow-sm">
            <p className="text-xs text-[#999]">환영합니다</p>
            <p className="text-base font-bold text-[#1A1A1A]">{user?.name}님, 샬롬!</p>
            <p className="text-xs text-[#999] mt-0.5">오늘도 선교의 사명을 감당해주세요</p>
          </div>
        </div>

        {/* ── Club Cards Carousel (4) ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-bold text-[#1A1A1A]">선교동아리</h2>
            <Link href="/clubs" className="text-xs text-[#999] flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Carousel */}
          <div className="relative group">
            {/* Left arrow */}
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="이전"
            >
              <ChevronLeft className="w-4 h-4 text-[#666]" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto px-4 pb-2 scroll-smooth scrollbar-hide snap-x snap-mandatory"
            >
              {clubs.map(club => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="snap-start shrink-0 w-[200px] bg-white rounded-2xl border border-[#EEE] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Poster image or fallback icon */}
                  <div
                    className="w-full h-[260px] flex items-center justify-center overflow-hidden relative"
                    style={{ backgroundColor: club.icon_color }}
                  >
                    {club.poster_image ? (
                      <Image
                        src={club.poster_image}
                        alt={club.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : (
                      <span className="text-6xl">{club.icon}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{club.name}</p>
                    <p className="text-xs text-[#999] mt-0.5 truncate">{club.slogan}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        club.recruitment_status === 'OPEN'
                          ? 'bg-[#E8F5E9] text-[#1E5631]'
                          : 'bg-gray-100 text-[#999]'
                      }`}>
                        {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="다음"
            >
              <ChevronRight className="w-4 h-4 text-[#666]" />
            </button>
          </div>
        </div>

        {/* ── Quick Menu Grid ── */}
        <div className="px-4 mb-6">
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

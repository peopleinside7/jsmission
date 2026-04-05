'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';

const MENUS = [
  { icon: '📢', label: '공지사항', href: '/boards/NOTICE' },
  { icon: '🏠', label: '선교동아리', href: '/clubs' },
  { icon: '📓', label: '선교 일지', href: '/mission' },
  { icon: '👥', label: '신입생 상황', href: '/newcomers' },
  { icon: '📖', label: '생명의 말씀', href: '/boards/SERMON' },
  { icon: '💬', label: '자유게시판', href: '/boards/FREE' },
  { icon: '📁', label: '자료실', href: '/resources' },
  { icon: '💡', label: 'Feedback', href: '/feedback' },
  { icon: '🔗', label: 'Family Site', href: '/mypage' },
];

const STAGE_COLORS: Record<string, string> = {
  ATTEMPT: '#4CAF50',
  PRELIM: '#FF9800',
  GOSPEL: '#E53935',
  WORSHIP: '#FF9800',
  COMPLETE: '#1E5631',
};
const STAGE_LABELS: Record<string, string> = {
  ATTEMPT: '시도',
  PRELIM: '전초',
  GOSPEL: '말씀연결',
  WORSHIP: '예배참석',
  COMPLETE: '수료',
};

interface ClubData {
  id: number;
  name: string;
  icon: string;
  icon_color: string;
  slogan: string;
  category: string;
  recruitment_status: string;
  member_count: number;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [notices, setNotices] = useState<Array<{ id: number; title: string; created_at: string }>>([]);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => setClubs(d.clubs || []));
    fetch('/api/newcomers/dashboard').then(r => r.json()).then(d => setPipeline(d.pipeline || {}));
    fetch('/api/boards/NOTICE').then(r => r.json()).then(d => setNotices((d.posts || []).slice(0, 3)));
  }, []);

  const totalNewcomers = Object.values(pipeline).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image src="/logo_h.png" alt="JS MISSION" width={120} height={36} className="brightness-0 invert" />
        </div>
        <Link href="/mypage" className="relative">
          <Bell className="w-6 h-6 text-white" />
        </Link>
      </div>

      <div className="page-container pt-4">
        {/* Welcome */}
        <div className="card p-5 mb-4">
          <p className="text-sm text-[#999]">환영합니다</p>
          <p className="text-lg font-bold text-[#1A1A1A]">{user?.name}님, 샬롬!</p>
          <p className="text-xs text-[#666] mt-1">오늘도 선교의 사명을 감당해주세요</p>
        </div>

        {/* Pipeline */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">선교 파이프라인</h3>
            <span className="text-xs text-[#999]">전체 {totalNewcomers}명</span>
          </div>
          <div className="flex gap-1">
            {(['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'] as const).map(stage => {
              const count = pipeline[stage] || 0;
              const pct = totalNewcomers > 0 ? Math.max((count / totalNewcomers) * 100, 8) : 20;
              return (
                <div key={stage} className="text-center" style={{ width: `${pct}%`, minWidth: '50px' }}>
                  <div
                    className="h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: STAGE_COLORS[stage] }}
                  >
                    {count}
                  </div>
                  <p className="text-[10px] text-[#666] mt-1">{STAGE_LABELS[stage]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {MENUS.map(menu => (
            <Link key={menu.href} href={menu.href} className="card p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{menu.icon}</div>
              <p className="text-xs font-medium text-[#333]">{menu.label}</p>
            </Link>
          ))}
        </div>

        {/* Notices */}
        {notices.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#1A1A1A]">공지사항</h3>
              <Link href="/boards/NOTICE" className="text-xs text-[#999] flex items-center">
                더보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="card divide-y divide-[#F5F5F5]">
              {notices.map(n => (
                <Link key={n.id} href={`/boards/NOTICE/${n.id}`} className="flex items-center px-4 py-3">
                  <span className="text-sm text-[#333] flex-1 truncate">{n.title}</span>
                  <ChevronRight className="w-4 h-4 text-[#BDBDBD]" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Clubs Scroll */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">선교동아리</h3>
            <Link href="/clubs" className="text-xs text-[#999] flex items-center">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {clubs.map(club => (
              <Link key={club.id} href={`/clubs/${club.id}`} className="card min-w-[150px] p-4 flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2"
                  style={{ backgroundColor: club.icon_color }}
                >
                  {club.icon}
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{club.name}</p>
                <p className="text-xs text-[#999] truncate">{club.slogan}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${club.recruitment_status === 'OPEN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#999]'}`}>
                    {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

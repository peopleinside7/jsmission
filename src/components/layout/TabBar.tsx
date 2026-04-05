'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutList, Users, Menu } from 'lucide-react';
import type { ReactNode } from 'react';

interface TabItem {
  href: string;
  label: string;
  icon: ReactNode;
  match: string[];
}

const tabs: TabItem[] = [
  { href: '/home', label: '홈', icon: <Home size={22} />, match: ['/home'] },
  {
    href: '/boards/free',
    label: '게시판',
    icon: <LayoutList size={22} />,
    match: ['/boards'],
  },
  // Center button placeholder (index 2 handled separately)
  { href: '/newcomers', label: '선교', icon: <Users size={22} />, match: ['/newcomers'] },
  { href: '/mypage', label: '전체메뉴', icon: <Menu size={22} />, match: ['/mypage'] },
];

function CrossIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="9" x2="22" y2="9" />
    </svg>
  );
}

export default function TabBar() {
  const pathname = usePathname();

  const isActive = (tab: TabItem) =>
    tab.match.some((m) => pathname.startsWith(m));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEEEEE] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[640px] mx-auto flex items-end justify-around h-16 px-2">
        {/* Left 2 tabs */}
        {tabs.slice(0, 2).map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 pt-2 pb-1 ${
              isActive(tab) ? 'text-[#1E5631]' : 'text-[#999]'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}

        {/* Center cross button */}
        <div className="flex flex-col items-center flex-1 -mt-5">
          <Link
            href="/mission"
            className="w-14 h-14 rounded-full bg-[#1E5631] text-white flex items-center justify-center shadow-lg shadow-[#1E5631]/30 hover:bg-[#2D7A3A] transition-colors"
          >
            <CrossIcon />
          </Link>
        </div>

        {/* Right 2 tabs */}
        {tabs.slice(2).map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 pt-2 pb-1 ${
              isActive(tab) ? 'text-[#1E5631]' : 'text-[#999]'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

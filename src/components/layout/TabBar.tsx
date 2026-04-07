'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, User, Menu } from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: string[];
}

const leftTabs: TabItem[] = [
  { href: '/clubs', label: '선교동아리', icon: <Users size={22} />, match: ['/clubs'] },
  { href: '/mission', label: '선교일지', icon: <BookOpen size={22} />, match: ['/mission'] },
];

const rightTabs: TabItem[] = [
  { href: '/mypage', label: 'My', icon: <User size={22} />, match: ['/newcomers', '/boards'] },
  { href: '/mypage', label: '전체메뉴', icon: <Menu size={22} />, match: ['/mypage', '/settings', '/feedback', '/resources'] },
];

export default function TabBar() {
  const pathname = usePathname();

  const isActive = (tab: TabItem) => tab.match.some(m => pathname.startsWith(m));

  const TabLink = ({ tab }: { tab: TabItem }) => (
    <Link
      href={tab.href}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 pt-2 pb-1 transition-colors ${
        isActive(tab) ? 'text-[#1E5631]' : 'text-[#999]'
      }`}
    >
      {tab.icon}
      <span className="text-[10px] font-medium">{tab.label}</span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEE] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[640px] mx-auto flex items-end justify-around h-16 px-2">
        {leftTabs.map(tab => <TabLink key={tab.href} tab={tab} />)}

        {/* Center Home Button */}
        <div className="flex flex-col items-center flex-1 -mt-5">
          <Link
            href="/home"
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              pathname === '/home'
                ? 'bg-[#1E5631] text-white shadow-[#1E5631]/30'
                : 'bg-[#1E5631] text-white shadow-[#1E5631]/20'
            }`}
          >
            <Home size={24} />
          </Link>
        </div>

        {rightTabs.map(tab => <TabLink key={tab.href} tab={tab} />)}
      </div>
    </nav>
  );
}

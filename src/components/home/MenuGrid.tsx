'use client';

import Link from 'next/link';

interface MenuItem {
  emoji: string;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { emoji: '📢', label: '공지사항', href: '/boards/notice' },
  { emoji: '🎯', label: '선교동아리', href: '/clubs' },
  { emoji: '📝', label: '선교일지', href: '/mission/logs' },
  { emoji: '👤', label: '신입생상황', href: '/newcomers' },
  { emoji: '📖', label: '생명의말씀', href: '/boards/devotion' },
  { emoji: '💬', label: '자유게시판', href: '/boards/free' },
  { emoji: '📁', label: '자료실', href: '/boards/resources' },
  { emoji: '💡', label: 'Feedback', href: '/boards/feedback' },
  { emoji: '🌐', label: 'Family Site', href: '/links' },
];

export default function MenuGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-xs font-medium text-[#333]">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

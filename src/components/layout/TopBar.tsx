'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function TopBar({ title, showBack, rightAction }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1E5631] h-14 flex items-center px-4">
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}
          <h1 className="text-white font-bold text-lg truncate">{title}</h1>
        </div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
}

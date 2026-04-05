'use client';

import type { ReactNode } from 'react';
import TopBar from './TopBar';
import TabBar from './TabBar';
import Toast from '@/components/ui/Toast';

interface MobileLayoutProps {
  title: string;
  showBack?: boolean;
  showTabBar?: boolean;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function MobileLayout({
  title,
  showBack,
  showTabBar = true,
  rightAction,
  children,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <TopBar title={title} showBack={showBack} rightAction={rightAction} />
      <main
        className={`max-w-[640px] mx-auto w-full pt-14 ${
          showTabBar ? 'pb-20' : 'pb-4'
        }`}
      >
        {children}
      </main>
      {showTabBar && <TabBar />}
      <Toast />
    </div>
  );
}

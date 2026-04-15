'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Bell, CheckCheck } from 'lucide-react';

type Notification = {
  id: number;
  title?: string;
  message?: string;
  content?: string;
  link?: string;
  url?: string;
  is_read?: number | boolean;
  read_at?: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.notifications || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  const isUnread = (n: Notification) => !(n.is_read === 1 || n.is_read === true || n.read_at);

  const handleClick = async (n: Notification) => {
    try {
      if (isUnread(n)) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n.id }),
        });
      }
    } catch {}
    const link = n.link || n.url;
    if (link) router.push(link);
    else load();
  };

  const markAll = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      load();
    } catch {}
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return s;
    }
  };

  return (
    <div className="pb-24 bg-[#F5F5F5] min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => router.back()} aria-label="뒤로가기"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white flex-1">알림</h1>
        <button
          onClick={markAll}
          className="text-xs text-white/90 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1"
        >
          <CheckCheck className="w-4 h-4" />
          모두 읽음
        </button>
        <Link href="/home">
          <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
        </Link>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center py-20 text-sm text-[#999]">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
            <p className="text-sm text-[#999]">알림이 없습니다</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const unread = isUnread(n);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left bg-white rounded-2xl p-4 border ${unread ? 'border-[#1E5631]/20' : 'border-[#EEE]'} hover:bg-[#FAFAFA] transition`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-[#4CAF50]' : 'bg-[#CCC]'}`}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <p className={`text-sm ${unread ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#555]'} truncate`}>
                            {n.title}
                          </p>
                        )}
                        {(n.message || n.content) && (
                          <p className="text-xs text-[#666] mt-1 line-clamp-2 whitespace-pre-wrap">
                            {n.message || n.content}
                          </p>
                        )}
                        <p className="text-[11px] text-[#999] mt-2">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface PrayerCardProps {
  newcomer: {
    id: number;
    name: string;
    prayer_request?: string;
  };
}

export default function PrayerCard({ newcomer }: PrayerCardProps) {
  const [isPraying, setIsPraying] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const handlePray = async () => {
    if (isPraying || prayed) return;
    setIsPraying(true);

    try {
      const res = await fetch(`/api/newcomers/${newcomer.id}/pray`, {
        method: 'POST',
      });
      if (res.ok) {
        setPrayed(true);
        addToast(`${newcomer.name}님을 위해 기도했습니다.`);
      } else {
        addToast('기도 기록에 실패했습니다.', 'error');
      }
    } catch {
      addToast('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setIsPraying(false);
    }
  };

  if (!newcomer.prayer_request) return null;

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-bold text-[#1A1A1A]">
          {newcomer.name}님의 기도제목
        </h4>
      </div>
      <p className="text-sm text-[#333] leading-relaxed mb-3">
        {newcomer.prayer_request}
      </p>
      <button
        onClick={handlePray}
        disabled={isPraying || prayed}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          prayed
            ? 'bg-[#E8F5E9] text-[#1E5631]'
            : 'bg-[#1E5631] text-white hover:bg-[#2D7A3A] active:scale-[0.98]'
        } disabled:opacity-60`}
      >
        {prayed ? '기도 완료' : '🙏 기도하기'}
      </button>
    </div>
  );
}

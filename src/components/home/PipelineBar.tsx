'use client';

import { useEffect, useState } from 'react';
import { STAGE_CONFIG, type StageKey } from '@/lib/utils';
import type { PipelineData } from '@/types';
import Skeleton from '@/components/ui/Skeleton';

const PIPELINE_STAGES: StageKey[] = ['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'];

export default function PipelineBar() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/newcomers/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json.pipeline);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 mx-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const total = PIPELINE_STAGES.reduce((sum, key) => sum + (data[key] || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-4 mx-4">
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">선교 파이프라인</h3>
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-8 bg-[#F5F5F5]">
        {PIPELINE_STAGES.map((stage) => {
          const count = data[stage] || 0;
          if (count === 0) return null;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const config = STAGE_CONFIG[stage];
          return (
            <div
              key={stage}
              className="flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{
                width: `${Math.max(pct, 10)}%`,
                backgroundColor: config.color,
              }}
            >
              {count}
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-2">
        {PIPELINE_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage];
          return (
            <div key={stage} className="flex flex-col items-center">
              <span className="text-sm">{config.icon}</span>
              <span className="text-[10px] text-[#666] mt-0.5">{config.label}</span>
              <span
                className="text-xs font-bold mt-0.5"
                style={{ color: config.color }}
              >
                {data[stage] || 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

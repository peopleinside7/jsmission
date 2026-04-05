'use client';

import { STAGE_CONFIG, type StageKey } from '@/lib/utils';

const STAGES: StageKey[] = ['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'];

interface StageSelectorProps {
  currentStage: StageKey;
  onSelect: (stage: StageKey) => void;
}

export default function StageSelector({ currentStage, onSelect }: StageSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {STAGES.map((stage) => {
        const config = STAGE_CONFIG[stage];
        const isActive = stage === currentStage;
        return (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? 'text-white shadow-md'
                : 'bg-white text-[#666] border border-[#EEEEEE] hover:border-[#999]'
            }`}
            style={
              isActive
                ? { backgroundColor: config.color }
                : undefined
            }
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

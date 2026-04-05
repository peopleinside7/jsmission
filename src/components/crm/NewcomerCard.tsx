import Link from 'next/link';
import { Phone, Clock } from 'lucide-react';
import type { Newcomer } from '@/types';
import { STAGE_CONFIG } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface NewcomerCardProps {
  newcomer: Newcomer;
}

const stageToBadgeVariant: Record<string, 'green' | 'red' | 'orange' | 'blue' | 'gray'> = {
  ATTEMPT: 'green',
  PRELIM: 'orange',
  GOSPEL: 'red',
  WORSHIP: 'orange',
  COMPLETE: 'green',
  LOST: 'gray',
};

export default function NewcomerCard({ newcomer }: NewcomerCardProps) {
  const stageConfig = STAGE_CONFIG[newcomer.status];

  return (
    <Link
      href={`/newcomers/${newcomer.id}`}
      className="block bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{stageConfig.icon}</span>
          <h4 className="text-sm font-bold text-[#1A1A1A]">{newcomer.name}</h4>
        </div>
        <Badge variant={stageToBadgeVariant[newcomer.status] ?? 'gray'}>
          {stageConfig.label}
        </Badge>
      </div>

      {newcomer.club_name && (
        <p className="text-xs text-[#666] mb-2">
          {newcomer.club_icon} {newcomer.club_name}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-[#999]">
        {newcomer.phone && (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {newcomer.phone}
          </span>
        )}
        {newcomer.last_contact_date && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDate(newcomer.last_contact_date)}
          </span>
        )}
      </div>
    </Link>
  );
}

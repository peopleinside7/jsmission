export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return formatDate(dateStr);
}

export const STAGE_CONFIG = {
  ATTEMPT: { label: '시도', icon: '🎯', color: '#4CAF50', bgColor: '#E8F5E9' },
  PRELIM: { label: '전초', icon: '☕', color: '#FF9800', bgColor: '#FFF3E0' },
  GOSPEL: { label: '말씀연결', icon: '📖', color: '#E53935', bgColor: '#FFEBEE' },
  WORSHIP: { label: '예배참석', icon: '⛪', color: '#FF9800', bgColor: '#FFF3E0' },
  COMPLETE: { label: '수료', icon: '🎓', color: '#1E5631', bgColor: '#E8F5E9' },
  LOST: { label: '이탈', icon: '❌', color: '#999', bgColor: '#F5F5F5' },
} as const;

export type StageKey = keyof typeof STAGE_CONFIG;

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

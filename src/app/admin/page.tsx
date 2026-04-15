'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, BookOpen, Target, FileText, MessageSquare, UserPlus, Sparkles,
  Calendar, ChevronRight, AlertCircle
} from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  ATTEMPT: '#5B9A6F', PRELIM: '#7BAA8E', GOSPEL: '#2D7A3A', WORSHIP: '#3D8B5A', COMPLETE: '#1E5631',
};
const STAGE_LABELS: Record<string, string> = {
  ATTEMPT: '시도', PRELIM: '전초', GOSPEL: '말씀연결', WORSHIP: '예배참석', COMPLETE: '수료',
};

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항', SERMON: '생명의 말씀', FREE: '자유게시판',
  RESOURCE: '자료실', FEEDBACK: 'Feedback', CLUB_NOTICE: '동아리 공지',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '관리자', PASTOR: '교역자', CLUB_ADMIN: '동아리운영자', USER: '일반회원',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = () => {
      fetch('/api/admin/dashboard', { cache: 'no-store' }).then(r => r.json()).then(d => setStats(d)).catch(() => {});
      fetch('/api/newcomers/dashboard', { cache: 'no-store' }).then(r => r.json()).then(d => setPipeline(d.pipeline || {})).catch(() => {});
    };
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" /></div>;

  const totalNewcomers = Object.values(pipeline).reduce((s: number, v: any) => s + (v || 0), 0);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">대시보드</h1>
        <p className="text-xs text-[#999] mt-1">{today}</p>
      </div>

      {/* === 오늘의 요약 (컴팩트, 컬러풀) === */}
      <div className="bg-white rounded-2xl border border-[#EEE] p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-[#FF9800]" />
          <h2 className="text-xs font-bold text-[#666]">오늘의 요약</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '신규 가입', value: stats.todayStats?.newUsers ?? 0, icon: UserPlus, color: '#5B9A6F', bg: '#EDF5F0' },
            { label: '새 게시글', value: stats.todayStats?.newPosts ?? 0, icon: FileText, color: '#1E88E5', bg: '#E3F2FD' },
            { label: '새 댓글', value: stats.todayStats?.newComments ?? 0, icon: MessageSquare, color: '#9C27B0', bg: '#F3E5F5' },
            { label: '신규 신입생', value: stats.todayStats?.newNewcomers ?? 0, icon: Target, color: '#FF9800', bg: '#FFF3E0' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: s.bg }}>
                <Icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                <div className="min-w-0">
                  <p className="text-base font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-[#666] leading-tight truncate">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === 누적 통계 카드 (컴팩트, 다양한 색상) === */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: '전체 회원', value: stats.userCount || 0, icon: Users, color: '#5B9A6F', bg: '#EDF5F0', sub: stats.pendingUsers ? `대기 ${stats.pendingUsers}` : '' },
          { label: '동아리', value: stats.clubCount || 0, icon: BookOpen, color: '#1E88E5', bg: '#E3F2FD', sub: '' },
          { label: '신입생', value: totalNewcomers, icon: Target, color: '#FF9800', bg: '#FFF3E0', sub: '' },
          { label: '게시글', value: stats.postCount || 0, icon: FileText, color: '#757575', bg: '#F5F5F5', sub: '' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-[#EEE] p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
                {stat.sub && (
                  <span className="text-[9px] bg-orange-50 text-[#FF9800] px-1.5 py-0.5 rounded-full font-medium">{stat.sub}</span>
                )}
              </div>
              <p className="text-xl font-bold text-[#1A1A1A] leading-tight">{stat.value}</p>
              <p className="text-[10px] text-[#999] mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* === 처리 필요 알림 (컴팩트) === */}
      {(stats.pendingUsers > 0 || stats.pendingApplications > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#FF9800] shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-[#FF9800]">처리 필요: </span>
            {stats.pendingUsers > 0 && <Link href="/admin/users" className="underline mr-3">회원 승인 {stats.pendingUsers}건</Link>}
            {stats.pendingApplications > 0 && <Link href="/admin/clubs" className="underline">동아리 신청 {stats.pendingApplications}건</Link>}
          </div>
        </div>
      )}

      {/* === 선교 파이프라인 (컴팩트) === */}
      <div className="bg-white rounded-2xl border border-[#EEE] p-3 mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-[#666]">선교 파이프라인</h2>
          <span className="text-[10px] text-[#999]">전체 {totalNewcomers}명</span>
        </div>
        <div className="flex items-center gap-1">
          {(['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'] as const).map((stage, i) => {
            const count = pipeline[stage] || 0;
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-white" style={{ backgroundColor: STAGE_COLORS[stage] }}>
                  <span className="text-sm font-bold">{count}</span>
                  <span className="text-[10px] opacity-90">{STAGE_LABELS[stage]}</span>
                </div>
                {i < 4 && <span className="text-[#BDBDBD] text-xs px-0.5">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* === 게시판별 글 수 차트 + 동아리별 신입생 === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <h3 className="text-base font-bold mb-4">게시판별 글 수</h3>
          {(!stats.boardPostCounts || stats.boardPostCounts.length === 0) ? (
            <p className="text-xs text-[#999] py-4 text-center">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {stats.boardPostCounts.map((b: any) => {
                const max = Math.max(...stats.boardPostCounts.map((x: any) => x.count));
                const pct = max > 0 ? (b.count / max) * 100 : 0;
                return (
                  <div key={b.board_type}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{BOARD_LABELS[b.board_type] || b.board_type}</span>
                      <span className="font-bold text-[#1E5631]">{b.count}건</span>
                    </div>
                    <div className="w-full bg-[#F5F5F5] rounded-full h-2.5 overflow-hidden">
                      <div className="h-full transition-all" style={{
                        width: `${pct}%`,
                        backgroundColor: ['#5B9A6F', '#1E88E5', '#FF9800', '#9C27B0', '#757575'][stats.boardPostCounts.indexOf(b) % 5]
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <h3 className="text-base font-bold mb-4">동아리별 신입생</h3>
          {(stats.clubStats || []).map((c: any) => (
            <Link key={c.id} href={`/clubs/${c.id}`} className="flex items-center gap-3 py-2 border-b border-[#F5F5F5] last:border-0 hover:bg-[#F7F7F7] -mx-2 px-2 rounded">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm flex-1">{c.name}</span>
              <span className="text-sm font-bold text-[#1E5631]">{c.newcomer_count || 0}명</span>
              <ChevronRight className="w-4 h-4 text-[#BDBDBD]" />
            </Link>
          ))}
        </div>
      </div>

      {/* === 최근 게시글 + 최근 가입 회원 === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">최근 게시글</h3>
            <Link href="/admin/boards" className="text-xs text-[#1E5631] flex items-center gap-1">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {(!stats.recentPosts || stats.recentPosts.length === 0) ? (
            <p className="text-xs text-[#999] py-4 text-center">게시글이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPosts.map((p: any) => (
                <Link key={p.id} href={`/boards/${p.board_type}/${p.id}`} className="block py-2 border-b border-[#F5F5F5] last:border-0 hover:bg-[#F7F7F7] -mx-2 px-2 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1E5631] font-medium">
                      {BOARD_LABELS[p.board_type] || p.board_type}
                    </span>
                    <span className="text-[10px] text-[#999]">{p.author_name}</span>
                    <span className="text-[10px] text-[#BDBDBD]">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{p.title}</p>
                  <div className="flex gap-3 text-[10px] text-[#999] mt-1">
                    <span>💬 {p.comment_count || 0}</span>
                    <span>❤ {p.like_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">최근 가입 회원</h3>
            <Link href="/admin/users" className="text-xs text-[#1E5631] flex items-center gap-1">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {(stats.recentUsers || []).slice(0, 5).map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#F5F5F5] last:border-0">
              <div className="w-9 h-9 bg-[#E8F5E9] rounded-full flex items-center justify-center text-xs font-bold text-[#1E5631]">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F8E9] text-[#1E5631]">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>
                <p className="text-xs text-[#999] truncate">{u.phone || '-'} · {u.department || '-'}</p>
              </div>
              {!u.is_approved && (
                <span className="text-[10px] bg-orange-50 text-[#FF9800] px-2 py-0.5 rounded-full">대기</span>
              )}
              <span className="text-[10px] text-[#BDBDBD] flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />{new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

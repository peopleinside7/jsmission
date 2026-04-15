'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, MessageSquare, Target, BookOpen } from 'lucide-react';

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항', SERMON: '생명의 말씀', FREE: '자유게시판',
  RESOURCE: '자료실', FEEDBACK: 'Feedback', CLUB_NOTICE: '동아리 공지',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '관리자', PASTOR: '교역자', CLUB_ADMIN: '동아리운영자', USER: '일반회원',
};

export default function AdminStatsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-12 text-[#999]">로딩 중...</div>;

  // 일별 차트 최대값 (스케일링용)
  const maxDaily = Math.max(
    1,
    ...data.dailyStats.map((d: any) => Math.max(d.newUsers, d.newPosts, d.newComments))
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">통계</h1>
        <p className="text-xs text-[#999] mt-1">앱 사용 현황 및 추이</p>
      </div>

      {/* 누적 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: '회원', value: data.total.users, icon: Users, color: '#1E5631' },
          { label: '동아리', value: data.total.clubs, icon: BookOpen, color: '#1E88E5' },
          { label: '게시글', value: data.total.posts, icon: FileText, color: '#FF9800' },
          { label: '댓글', value: data.total.comments, icon: MessageSquare, color: '#9C27B0' },
          { label: '신입생', value: data.total.newcomers, icon: Target, color: '#E53935' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-[#EEE] rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.color + '15' }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-xs text-[#999]">{s.label}</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* 일별 추이 차트 (간단한 막대) */}
      <div className="bg-white border border-[#EEE] rounded-2xl p-5 mb-6">
        <h3 className="text-base font-bold mb-4">최근 7일 추이</h3>
        <div className="space-y-4">
          {[
            { key: 'newUsers', label: '신규 가입자', color: '#1E5631' },
            { key: 'newPosts', label: '신규 게시글', color: '#FF9800' },
            { key: 'newComments', label: '신규 댓글', color: '#1E88E5' },
          ].map(metric => (
            <div key={metric.key}>
              <p className="text-xs font-semibold text-[#666] mb-2">{metric.label}</p>
              <div className="flex items-end gap-1 h-24">
                {data.dailyStats.map((d: any) => {
                  const val = d[metric.key];
                  const heightPct = (val / maxDaily) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end">
                      <div className="text-[10px] text-[#666] mb-1">{val}</div>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: metric.color, opacity: 0.85 }}
                      />
                      <div className="text-[10px] text-[#999] mt-1">{d.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 게시판별 글 수 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-3">게시판별 글 수</h3>
          {data.boardStats.length === 0 ? (
            <p className="text-xs text-[#999] py-4 text-center">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {data.boardStats.map((b: any) => {
                const max = Math.max(...data.boardStats.map((x: any) => x.count));
                const pct = max > 0 ? (b.count / max) * 100 : 0;
                return (
                  <div key={b.board_type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{BOARD_LABELS[b.board_type] || b.board_type}</span>
                      <span className="font-bold">{b.count}건</span>
                    </div>
                    <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-[#1E5631]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 등급별 회원 수 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-3">등급별 회원 수</h3>
          {data.roleStats.length === 0 ? (
            <p className="text-xs text-[#999] py-4 text-center">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {data.roleStats.map((r: any) => (
                <div key={r.role} className="flex justify-between text-sm py-2 border-b border-[#F5F5F5] last:border-0">
                  <span>{ROLE_LABELS[r.role] || r.role}</span>
                  <span className="font-bold">{r.count}명</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 동아리별 멤버 수 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-bold mb-3">동아리별 멤버 수</h3>
          <div className="space-y-2">
            {data.clubStats.map((c: any) => {
              const max = Math.max(1, ...data.clubStats.map((x: any) => x.member_count));
              const pct = (c.member_count / max) * 100;
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.icon} {c.name}</span>
                    <span className="font-bold">{c.member_count}명</span>
                  </div>
                  <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[#1E5631]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

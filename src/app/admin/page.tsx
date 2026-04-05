'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, Target, TrendingUp } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  ATTEMPT: '#4CAF50', PRELIM: '#FF9800', GOSPEL: '#E53935', WORSHIP: '#FF9800', COMPLETE: '#1E5631',
};
const STAGE_LABELS: Record<string, string> = {
  ATTEMPT: '시도', PRELIM: '전초', GOSPEL: '말씀연결', WORSHIP: '예배참석', COMPLETE: '수료',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch('/api/newcomers/dashboard').then(r => r.json()).then(d => setPipeline(d.pipeline || {})).catch(() => {});
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" /></div>;

  const totalNewcomers = Object.values(pipeline).reduce((s: number, v: any) => s + (v || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">대시보드</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 회원', value: stats.userCount || 0, icon: Users, color: '#1E5631' },
          { label: '동아리', value: stats.clubCount || 0, icon: BookOpen, color: '#4CAF50' },
          { label: '신입생', value: totalNewcomers, icon: Target, color: '#FF9800' },
          { label: '게시글', value: stats.postCount || 0, icon: TrendingUp, color: '#1E88E5' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#EEE] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1A1A1A]">{stat.value}</p>
            <p className="text-sm text-[#999] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl border border-[#EEE] p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">선교 파이프라인</h2>
        <div className="flex gap-2">
          {(['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'] as const).map((stage, i) => {
            const count = pipeline[stage] || 0;
            const pct = totalNewcomers > 0 ? (count / totalNewcomers) * 100 : 20;
            return (
              <div key={stage} className="flex-1">
                <div className="h-16 rounded-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: STAGE_COLORS[stage] }}>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-xs opacity-80">{STAGE_LABELS[stage]}</span>
                </div>
                {i < 4 && (
                  <div className="text-center text-[#BDBDBD] text-lg my-1">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <h3 className="text-base font-bold mb-4">최근 가입 회원</h3>
          {(stats.recentUsers || []).map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#F5F5F5] last:border-0">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center text-xs font-bold text-[#1E5631]">{u.name[0]}</div>
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-[#999]">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <h3 className="text-base font-bold mb-4">동아리별 신입생</h3>
          {(stats.clubStats || []).map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-[#F5F5F5] last:border-0">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm flex-1">{c.name}</span>
              <span className="text-sm font-bold text-[#1E5631]">{c.newcomer_count || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

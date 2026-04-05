'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Phone, Calendar, User } from 'lucide-react';

const STAGES = [
  { key: 'ATTEMPT', label: '시도', icon: '🎯', color: '#4CAF50' },
  { key: 'PRELIM', label: '전초', icon: '☕', color: '#FF9800' },
  { key: 'GOSPEL', label: '말씀연결', icon: '📖', color: '#E53935' },
  { key: 'WORSHIP', label: '예배참석', icon: '⛪', color: '#FF9800' },
  { key: 'COMPLETE', label: '수료', icon: '🎓', color: '#1E5631' },
];

export default function NewcomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newcomer, setNewcomer] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ content: '', activity_type: 'ATTEMPT' });

  useEffect(() => {
    fetch(`/api/newcomers/${params.id}`).then(r => r.json()).then(d => setNewcomer(d.newcomer));
    fetch(`/api/newcomers/${params.id}/logs`).then(r => r.json()).then(d => setLogs(d.logs || []));
  }, [params.id]);

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/newcomers/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setNewcomer({ ...newcomer, status });
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/newcomers/${params.id}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logForm),
    });
    if (res.ok) {
      const data = await res.json();
      setLogs([data.log, ...logs]);
      setShowLog(false);
      setLogForm({ content: '', activity_type: 'ATTEMPT' });
    }
  };

  if (!newcomer) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" /></div>;

  const currentStageIdx = STAGES.findIndex(s => s.key === newcomer.status);

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white">{newcomer.name}</h1>
      </div>

      <div className="px-4 pt-6 max-w-[640px] mx-auto">
        {/* Profile */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center text-2xl font-bold text-[#1E5631] mx-auto mb-3">
            {newcomer.name[0]}
          </div>
          <h2 className="text-xl font-bold">{newcomer.name}</h2>
          <p className="text-sm text-[#999] mt-1">{newcomer.club_name}</p>
        </div>

        {/* Stage Progress */}
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">선교 단계</h3>
          <div className="flex items-center justify-between">
            {STAGES.map((stage, i) => (
              <button
                key={stage.key}
                onClick={() => handleStatusChange(stage.key)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${i <= currentStageIdx ? 'shadow-md' : 'opacity-40'}`}
                  style={{ backgroundColor: i <= currentStageIdx ? stage.color : '#E5E5E5' }}
                >
                  {stage.icon}
                </div>
                <span className="text-[10px] text-[#666]">{stage.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card p-4 mb-4 space-y-3">
          {newcomer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#999]" />
              <span className="text-sm text-[#333]">{newcomer.phone}</span>
            </div>
          )}
          {newcomer.age_group && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#999]" />
              <span className="text-sm text-[#333]">{newcomer.age_group} / {newcomer.gender || '-'}</span>
            </div>
          )}
          {newcomer.how_met && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#999]" />
              <span className="text-sm text-[#333]">만남: {newcomer.how_met}</span>
            </div>
          )}
          {newcomer.introduction && (
            <p className="text-sm text-[#666] bg-[#F7F7F7] p-3 rounded-lg">{newcomer.introduction}</p>
          )}
        </div>

        {/* Prayer */}
        {newcomer.prayer_request && (
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-bold mb-2">🙏 기도제목</h3>
            <p className="text-sm text-[#666]">{newcomer.prayer_request}</p>
            <button
              onClick={() => fetch(`/api/newcomers/${params.id}/pray`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '기도합니다' }) })}
              className="mt-2 px-4 py-2 bg-[#E8F5E9] text-[#1E5631] rounded-full text-xs font-medium"
            >
              🙏 기도하기
            </button>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">활동 기록</h3>
            <button onClick={() => setShowLog(true)} className="text-xs bg-[#1E5631] text-white px-3 py-1.5 rounded-full">+ 기록 추가</button>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-6 text-[#999] text-sm">활동 기록이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => {
                const stage = STAGES.find(s => s.key === log.activity_type);
                return (
                  <div key={log.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: stage?.color || '#999' }}>
                      {stage?.icon || '📝'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: stage?.color }}>{stage?.label}</span>
                        <span className="text-xs text-[#BDBDBD]">{new Date(log.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <p className="text-sm text-[#333] mt-0.5">{log.content}</p>
                      <p className="text-xs text-[#999] mt-0.5">{log.author_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Log Modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowLog(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">활동 기록 추가</h3>
            <form onSubmit={handleAddLog} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">단계</label>
                <div className="flex gap-2 overflow-x-auto">
                  {STAGES.map(s => (
                    <button
                      key={s.key} type="button"
                      onClick={() => setLogForm({ ...logForm, activity_type: s.key })}
                      className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 ${logForm.activity_type === s.key ? 'text-white' : 'bg-[#F7F7F7] text-[#666]'}`}
                      style={logForm.activity_type === s.key ? { backgroundColor: s.color } : {}}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="input-field min-h-[80px]" placeholder="활동 내용" required value={logForm.content} onChange={e => setLogForm({ ...logForm, content: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLog(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">기록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

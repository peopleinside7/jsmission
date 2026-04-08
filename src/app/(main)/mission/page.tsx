'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ChevronLeft, Plus, MapPin, Clock, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const STAGE_COLORS: Record<string, string> = {
  ATTEMPT: '#5B9A6F', PRELIM: '#7BAA8E', GOSPEL: '#2D7A3A', WORSHIP: '#3D8B5A', COMPLETE: '#1E5631',
};
const STAGE_LABELS: Record<string, string> = {
  ATTEMPT: '시도', PRELIM: '전초', GOSPEL: '말씀연결', WORSHIP: '예배참석', COMPLETE: '수료',
};

export default function MissionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState(0);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [apptComments, setApptComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});

  const [apptForm, setApptForm] = useState({
    appointment_type: 'STREET', title: '', description: '', appointment_date: '', start_time: '', location: ''
  });

  useEffect(() => {
    fetch('/api/newcomers/dashboard').then(r => r.json()).then(d => setPipeline(d.pipeline || {})).catch(() => {});
    fetch('/api/mission/appointments').then(r => r.json()).then(d => {
      const appts = d.appointments || [];
      setAppointments(appts);
      // 각 약속의 댓글도 자동 로드
      appts.forEach((a: any) => {
        fetch(`/api/mission/appointments/${a.id}/comments`).then(r => r.json()).then(cd => {
          setApptComments(prev => ({ ...prev, [a.id]: cd.comments || [] }));
        }).catch(() => {});
      });
    }).catch(() => {});
    fetch('/api/mission/logs').then(r => r.json()).then(d => setLogs(d.logs || [])).catch(() => {});
  }, []);

  const handleCreateAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/mission/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apptForm),
    });
    if (res.ok) {
      setShowCreate(false);
      const data = await res.json();
      setAppointments([data.appointment, ...appointments]);
    }
  };

  const loadApptComments = async (apptId: number, force?: boolean) => {
    if (apptComments[apptId] && !force) return;
    try {
      const res = await fetch(`/api/mission/appointments/${apptId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setApptComments(prev => ({ ...prev, [apptId]: data.comments || [] }));
      }
    } catch { /* ignore */ }
  };

  const submitApptComment = async (apptId: number) => {
    const text = (newComment[apptId] || '').trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/mission/appointments/${apptId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        setNewComment(prev => ({ ...prev, [apptId]: '' }));
        await loadApptComments(apptId, true); // 강제 리로드
      }
    } catch { /* ignore */ }
  };

  const handleDeleteAppt = async (apptId: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/mission/appointments/${apptId}`, { method: 'DELETE' });
    if (res.ok) setAppointments(appointments.filter(a => a.id !== apptId));
  };

  const handleDeleteComment = async (apptId: number, commentId: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/mission/appointments/${apptId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    loadApptComments(apptId, true);
  };

  const totalNewcomers = Object.values(pipeline).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white"><ChevronLeft className="w-6 h-6" /></button>
        <Link href="/mission"><h1 className="text-lg font-bold text-white flex-1">선교 일지</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EEE] flex">
        {['대시보드', '노방 전도', '전단지 선교'].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="page-container pt-4">
        {/* Dashboard */}
        {tab === 0 && (
          <>
            {/* Pipeline */}
            <div className="card p-4 mb-4">
              <h3 className="text-sm font-bold mb-3">선교 파이프라인</h3>
              <div className="flex gap-1">
                {(['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'] as const).map(stage => {
                  const count = pipeline[stage] || 0;
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: STAGE_COLORS[stage] }}>
                        {count}
                      </div>
                      <p className="text-[10px] text-[#666] mt-1">{STAGE_LABELS[stage]}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#999] text-center mt-2">전체 {totalNewcomers}명</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[#1E5631]">{appointments.filter(a => a.appointment_type === 'STREET').length}</p>
                <p className="text-xs text-[#999]">노방 전도 약속</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[#FF9800]">{appointments.filter(a => a.appointment_type === 'PROMOTION').length}</p>
                <p className="text-xs text-[#999]">전단지 선교</p>
              </div>
            </div>

            {/* Recent logs */}
            <h3 className="text-sm font-bold mb-3">최근 활동</h3>
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="card p-4 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.log_type === 'STREET' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-orange-50 text-[#FF9800]'}`}>
                    {log.log_type === 'STREET' ? '전도' : '전단지'}
                  </span>
                  <span className="text-xs text-[#999]">{log.user_name}</span>
                </div>
                <p className="text-sm text-[#333]">{log.content}</p>
                {log.location && <p className="text-xs text-[#999] mt-1"><MapPin className="w-3 h-3 inline" /> {log.location}</p>}
              </div>
            ))}
          </>
        )}

        {/* Street / Promotion tab */}
        {(tab === 1 || tab === 2) && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{tab === 1 ? '노방 전도' : '전단지 선교'}</h3>
              <button onClick={() => { setApptForm({ ...apptForm, appointment_type: tab === 1 ? 'STREET' : 'PROMOTION' }); setShowCreate(true); }} className="text-xs bg-[#1E5631] text-white px-3 py-1.5 rounded-full flex items-center gap-1"><Plus className="w-3 h-3" /> 약속</button>
            </div>

            {/* Appointments with inline comments */}
            {appointments.filter(a => a.appointment_type === (tab === 1 ? 'STREET' : 'PROMOTION')).length === 0 ? (
              <div className="text-center py-6 text-[#999] text-sm mb-4">등록된 약속이 없습니다</div>
            ) : appointments.filter(a => a.appointment_type === (tab === 1 ? 'STREET' : 'PROMOTION')).map(a => (
              <div key={a.id} className="card mb-3 overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => loadApptComments(a.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#999]">{a.creator_name || '작성자'}</span>
                  </div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  {a.description && <p className="text-xs text-[#666] mt-1">{a.description}</p>}
                  <div className="flex gap-3 mt-1">
                    {a.appointment_date && <span className="text-xs text-[#999]"><Clock className="w-3 h-3 inline" /> {a.appointment_date} {a.start_time || ''}</span>}
                    {a.location && <span className="text-xs text-[#999]"><MapPin className="w-3 h-3 inline" /> {a.location}</span>}
                  </div>
                  {(a.created_by === user?.userId || user?.role === 'ADMIN') && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); /* edit */ }} className="text-[10px] text-[#999] hover:text-[#1E5631]">수정</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAppt(a.id); }} className="text-[10px] text-[#999] hover:text-[#E53935]">삭제</button>
                    </div>
                  )}
                </div>
                {/* Inline comments */}
                <div className="border-t border-[#F0F0F0] bg-[#FAFAFA]">
                  {(apptComments[a.id] || []).length > 0 && (
                    <div className="px-4 pt-3 space-y-2">
                      {(apptComments[a.id] || []).map((c: any) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1E5631] shrink-0">{c.author_name?.[0] || '?'}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#1E5631]">{c.author_name}</span>
                              <span className="text-[10px] text-[#BDBDBD]">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <p className="text-xs text-[#555] mt-0.5">{c.content}</p>
                          </div>
                          {(c.user_id === user?.userId || user?.role === 'ADMIN') && (
                            <button onClick={() => handleDeleteComment(a.id, c.id)} className="text-[10px] text-[#BDBDBD] hover:text-[#E53935] ml-auto shrink-0">삭제</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-3 flex gap-2">
                    <input
                      className="input-field flex-1 text-xs"
                      placeholder="댓글을 입력하세요"
                      value={newComment[a.id] || ''}
                      onChange={e => setNewComment(prev => ({ ...prev, [a.id]: e.target.value }))}
                      onFocus={() => loadApptComments(a.id)}
                      onKeyDown={e => e.key === 'Enter' && submitApptComment(a.id)}
                    />
                    <button onClick={() => submitApptComment(a.id)} className="w-8 h-8 bg-[#1E5631] rounded-lg flex items-center justify-center shrink-0">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">약속 만들기</h3>
            <form onSubmit={handleCreateAppt} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={apptForm.title} onChange={e => setApptForm({ ...apptForm, title: e.target.value })} />
              <input className="input-field" type="date" value={apptForm.appointment_date} onChange={e => setApptForm({ ...apptForm, appointment_date: e.target.value })} />
              <input className="input-field" type="time" value={apptForm.start_time} onChange={e => setApptForm({ ...apptForm, start_time: e.target.value })} />
              <input className="input-field" placeholder="장소" value={apptForm.location} onChange={e => setApptForm({ ...apptForm, location: e.target.value })} />
              <textarea className="input-field min-h-[60px]" placeholder="설명" value={apptForm.description} onChange={e => setApptForm({ ...apptForm, description: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">만들기</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

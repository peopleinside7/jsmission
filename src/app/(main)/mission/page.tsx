'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ChevronLeft, Plus, MapPin, Clock, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STAGE_COLORS: Record<string, string> = {
  ATTEMPT: '#4CAF50', PRELIM: '#FF9800', GOSPEL: '#E53935', WORSHIP: '#FF9800', COMPLETE: '#1E5631',
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
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState<'STREET' | 'PROMOTION'>('STREET');

  const [apptForm, setApptForm] = useState({
    appointment_type: 'STREET', title: '', description: '', appointment_date: '', start_time: '', location: ''
  });
  const [logForm, setLogForm] = useState({
    log_type: 'STREET', content: '', location: '', result_summary: '', attempt_count: 0
  });

  useEffect(() => {
    fetch('/api/newcomers/dashboard').then(r => r.json()).then(d => setPipeline(d.pipeline || {})).catch(() => {});
    fetch('/api/mission/appointments').then(r => r.json()).then(d => setAppointments(d.appointments || [])).catch(() => {});
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

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/mission/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logForm),
    });
    if (res.ok) {
      setShowLogForm(false);
      const data = await res.json();
      setLogs([data.log, ...logs]);
    }
  };

  const totalNewcomers = Object.values(pipeline).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-4 flex items-center gap-3">
        <h1 className="text-lg font-bold text-white flex-1">선교 일지</h1>
        <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EEE] flex">
        {['대시보드', '노방선교', '동아리 홍보'].map((t, i) => (
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
                <p className="text-xs text-[#999]">노방선교 약속</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[#FF9800]">{appointments.filter(a => a.appointment_type === 'PROMOTION').length}</p>
                <p className="text-xs text-[#999]">동아리 홍보</p>
              </div>
            </div>

            {/* Recent logs */}
            <h3 className="text-sm font-bold mb-3">최근 활동</h3>
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="card p-4 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.log_type === 'STREET' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-orange-50 text-[#FF9800]'}`}>
                    {log.log_type === 'STREET' ? '노방' : '홍보'}
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
              <h3 className="text-base font-bold">{tab === 1 ? '노방선교' : '동아리 홍보'}</h3>
              <div className="flex gap-2">
                <button onClick={() => { setLogType(tab === 1 ? 'STREET' : 'PROMOTION'); setShowLogForm(true); }} className="text-xs bg-[#E8F5E9] text-[#1E5631] px-3 py-1.5 rounded-full">활동기록</button>
                <button onClick={() => { setApptForm({ ...apptForm, appointment_type: tab === 1 ? 'STREET' : 'PROMOTION' }); setShowCreate(true); }} className="text-xs bg-[#1E5631] text-white px-3 py-1.5 rounded-full flex items-center gap-1"><Plus className="w-3 h-3" /> 약속</button>
              </div>
            </div>

            {/* Appointments */}
            <h4 className="text-sm font-semibold text-[#666] mb-2">약속 목록</h4>
            {appointments.filter(a => a.appointment_type === (tab === 1 ? 'STREET' : 'PROMOTION')).length === 0 ? (
              <div className="text-center py-6 text-[#999] text-sm mb-4">등록된 약속이 없습니다</div>
            ) : appointments.filter(a => a.appointment_type === (tab === 1 ? 'STREET' : 'PROMOTION')).map(a => (
              <div key={a.id} className="card p-4 mb-2">
                <p className="text-sm font-semibold">{a.title}</p>
                <div className="flex gap-3 mt-1">
                  {a.appointment_date && <span className="text-xs text-[#999]"><Clock className="w-3 h-3 inline" /> {a.appointment_date} {a.start_time || ''}</span>}
                  {a.location && <span className="text-xs text-[#999]"><MapPin className="w-3 h-3 inline" /> {a.location}</span>}
                </div>
              </div>
            ))}

            {/* Logs */}
            <h4 className="text-sm font-semibold text-[#666] mb-2 mt-4">활동 기록</h4>
            {logs.filter(l => l.log_type === (tab === 1 ? 'STREET' : 'PROMOTION')).length === 0 ? (
              <div className="text-center py-6 text-[#999] text-sm">활동 기록이 없습니다</div>
            ) : logs.filter(l => l.log_type === (tab === 1 ? 'STREET' : 'PROMOTION')).map(l => (
              <div key={l.id} className="card p-4 mb-2">
                <p className="text-sm">{l.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#999]">{l.user_name}</span>
                  {l.attempt_count > 0 && <span className="text-xs text-[#4CAF50]">시도 {l.attempt_count}건</span>}
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

      {/* Create Log Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowLogForm(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">활동 기록</h3>
            <form onSubmit={handleCreateLog} className="space-y-3">
              <textarea className="input-field min-h-[80px]" placeholder="활동 내용을 작성해주세요" required value={logForm.content} onChange={e => setLogForm({ ...logForm, content: e.target.value, log_type: logType })} />
              <input className="input-field" placeholder="장소" value={logForm.location} onChange={e => setLogForm({ ...logForm, location: e.target.value })} />
              <div>
                <label className="text-sm font-medium text-[#333] mb-1 block">시도 횟수</label>
                <input className="input-field" type="number" min="0" value={logForm.attempt_count} onChange={e => setLogForm({ ...logForm, attempt_count: parseInt(e.target.value) || 0 })} />
              </div>
              <textarea className="input-field min-h-[60px]" placeholder="결과 요약" value={logForm.result_summary} onChange={e => setLogForm({ ...logForm, result_summary: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLogForm(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">기록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

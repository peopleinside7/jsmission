'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ATTEMPT: { label: '시도', color: '#4CAF50', bg: '#E8F5E9' },
  PRELIM: { label: '전초', color: '#FF9800', bg: '#FFF3E0' },
  GOSPEL: { label: '말씀연결', color: '#E53935', bg: '#FFEBEE' },
  WORSHIP: { label: '예배참석', color: '#FF9800', bg: '#FFF3E0' },
  COMPLETE: { label: '수료', color: '#1E5631', bg: '#E8F5E9' },
  LOST: { label: '이탈', color: '#999', bg: '#F5F5F5' },
};

export default function NewcomersPage() {
  const [tab, setTab] = useState(0);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [newcomers, setNewcomers] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    club_id: '', name: '', phone: '', age_group: '', gender: '', introduction: '', how_met: '', prayer_request: ''
  });

  useEffect(() => {
    fetch('/api/newcomers/dashboard?withList=true').then(r => r.json()).then(d => {
      setPipeline(d.pipeline || {});
      setNewcomers(d.newcomers || []);
    }).catch(() => {});
    fetch('/api/clubs').then(r => r.json()).then(d => setClubs(d.clubs || [])).catch(() => {});
  }, []);

  const filtered = newcomers.filter(n => {
    if (filter !== 'ALL' && n.status !== filter) return false;
    if (search && !n.name.includes(search)) return false;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.club_id) return alert('동아리를 선택해주세요');
    const res = await fetch(`/api/clubs/${createForm.club_id}/newcomers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      const data = await res.json();
      setNewcomers([data.newcomer, ...newcomers]);
      setShowCreate(false);
      setCreateForm({ club_id: '', name: '', phone: '', age_group: '', gender: '', introduction: '', how_met: '', prayer_request: '' });
    }
  };

  const totalNewcomers = Object.values(pipeline).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">신입생 상황</h1>
        <button onClick={() => setShowCreate(true)} className="text-white bg-white/20 p-2 rounded-full">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EEE] flex">
        {['대시보드', '기도제목', '목록'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}>{t}</button>
        ))}
      </div>

      <div className="page-container pt-4">
        {/* Dashboard */}
        {tab === 0 && (
          <>
            <div className="card p-4 mb-4">
              <h3 className="text-sm font-bold mb-3">파이프라인</h3>
              <div className="flex gap-1">
                {Object.entries(STAGE_CONFIG).filter(([k]) => k !== 'LOST').map(([key, cfg]) => {
                  const count = pipeline[key] || 0;
                  return (
                    <div key={key} className="flex-1 text-center">
                      <div className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: cfg.color }}>
                        {count}
                      </div>
                      <p className="text-[10px] text-[#666] mt-1">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-center text-[#999] mt-2">전체 {totalNewcomers}명</p>
            </div>

            {/* By club */}
            <h3 className="text-sm font-bold mb-3">동아리별 현황</h3>
            {clubs.map(club => {
              const clubNewcomers = newcomers.filter(n => n.club_id === club.id);
              return clubNewcomers.length > 0 ? (
                <div key={club.id} className="card p-4 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{club.icon}</span>
                    <span className="text-sm font-semibold">{club.name}</span>
                    <span className="text-xs text-[#999]">{clubNewcomers.length}명</span>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(STAGE_CONFIG).filter(([k]) => k !== 'LOST').map(([key, cfg]) => {
                      const count = clubNewcomers.filter(n => n.status === key).length;
                      return (
                        <div key={key} className="flex-1">
                          <div className="h-6 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: count > 0 ? cfg.color : '#E5E5E5' }}>
                            {count || ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })}
          </>
        )}

        {/* Prayer */}
        {tab === 1 && (
          <div className="space-y-3">
            {newcomers.filter(n => n.prayer_request).length === 0 ? (
              <div className="text-center py-10 text-[#999] text-sm">기도제목이 없습니다</div>
            ) : newcomers.filter(n => n.prayer_request).map(n => (
              <div key={n.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center text-sm font-bold text-[#1E5631]">{n.name[0]}</div>
                    <div>
                      <p className="text-sm font-medium">{n.name}</p>
                      <p className="text-xs text-[#999]">{n.club_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetch(`/api/newcomers/${n.id}/pray`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '기도합니다' }) })}
                    className="px-3 py-1.5 bg-[#E8F5E9] text-[#1E5631] rounded-full text-xs font-medium"
                  >
                    🙏 기도
                  </button>
                </div>
                <p className="text-sm text-[#666] bg-[#F7F7F7] p-3 rounded-lg">{n.prayer_request}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {tab === 2 && (
          <>
            {/* Search + Filter */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="input-field pl-9" placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {[{ key: 'ALL', label: '전체' }, ...Object.entries(STAGE_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label }))].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filter === f.key ? 'bg-[#1E5631] text-white' : 'bg-white border border-[#EEE] text-[#666]'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map(n => {
                const cfg = STAGE_CONFIG[n.status] || STAGE_CONFIG.LOST;
                return (
                  <Link key={n.id} href={`/newcomers/${n.id}`} className="card p-4 flex items-center gap-3 block">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-sm font-bold text-[#1E5631]">{n.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.name}</p>
                      <p className="text-xs text-[#999]">{n.club_name} / {n.how_met || '-'}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">신입생 등록</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <select className="input-field" required value={createForm.club_id} onChange={e => setCreateForm({ ...createForm, club_id: e.target.value })}>
                <option value="">동아리 선택</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <input className="input-field" placeholder="이름 *" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              <input className="input-field" placeholder="연락처" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input-field" value={createForm.age_group} onChange={e => setCreateForm({ ...createForm, age_group: e.target.value })}>
                  <option value="">연령대</option>
                  <option>10대</option><option>20대</option><option>30대</option><option>40대</option><option>50대+</option>
                </select>
                <select className="input-field" value={createForm.gender} onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}>
                  <option value="">성별</option>
                  <option>남성</option><option>여성</option>
                </select>
              </div>
              <input className="input-field" placeholder="만남 경위 (전단지, 지인, 노방 등)" value={createForm.how_met} onChange={e => setCreateForm({ ...createForm, how_met: e.target.value })} />
              <textarea className="input-field min-h-[60px]" placeholder="소개" value={createForm.introduction} onChange={e => setCreateForm({ ...createForm, introduction: e.target.value })} />
              <textarea className="input-field min-h-[60px]" placeholder="기도제목" value={createForm.prayer_request} onChange={e => setCreateForm({ ...createForm, prayer_request: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

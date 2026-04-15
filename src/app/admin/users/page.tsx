'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, Clock, Users, Network, Shield, Crown, UserCog, User as UserIcon } from 'lucide-react';

const ROLES: Record<string, { label: string; color: string; bg: string; icon: any; level: number }> = {
  ADMIN:      { label: '관리자',     color: '#fff',    bg: '#1E5631', icon: Crown,   level: 1 },
  PASTOR:     { label: '교역자',     color: '#1E5631', bg: '#E8F5E9', icon: Shield,  level: 2 },
  CLUB_ADMIN: { label: '동아리운영자', color: '#1E88E5', bg: '#E3F2FD', icon: UserCog, level: 3 },
  USER:       { label: '일반회원',   color: '#666',    bg: '#F5F5F5', icon: UserIcon,level: 4 },
};

const FILTER_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인 대기' },
  { key: 'ADMIN', label: '관리자' },
  { key: 'PASTOR', label: '교역자' },
  { key: 'CLUB_ADMIN', label: '동아리운영자' },
  { key: 'USER', label: '일반회원' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const [view, setView] = useState<'list' | 'tree'>('list');
  const [loading, setLoading] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/admin/users', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', department: '' });

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditForm({ name: u.name || '', phone: u.phone || '', department: u.department || '' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) { alert('이름은 필수입니다'); return; }
    const res = await fetch(`/api/admin/users/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, phone: editForm.phone, department: editForm.department }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || '수정 실패'); return; }
    setUsers(users.map(u => u.id === editingId ? { ...u, ...editForm } : u));
    setEditingId(null);
  };

  // 등급 변경
  const handleRoleChange = async (userId: number, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      const d = await res.json();
      alert(d.error || '역할 변경 실패');
    }
  };

  const handleApprove = async (userId: number) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.ok) setUsers(users.map(u => u.id === userId ? { ...u, is_approved: 1 } : u));
  };

  const handleReject = async (userId: number) => {
    if (!confirm('이 회원을 거절(비활성화)하시겠습니까?')) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.ok) setUsers(users.filter(u => u.id !== userId));
  };

  // 동아리 목록 (필터용)
  const allClubs = useMemo(() => {
    const map = new Map<number, string>();
    users.forEach(u => u.clubs?.forEach((c: any) => map.set(c.club_id, `${c.club_icon} ${c.club_name}`)));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [users]);

  // 필터링된 회원 목록
  const filtered = users.filter(u => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.phone?.includes(q)) return false;
    }
    if (filter === 'pending' && u.is_approved) return false;
    if (filter !== 'all' && filter !== 'pending' && u.role !== filter) return false;
    if (clubFilter !== 'all') {
      const hasClub = u.clubs?.some((c: any) => c.club_id === parseInt(clubFilter));
      if (!hasClub) return false;
    }
    return true;
  });

  // 등급별 그룹핑 (조직도용)
  const groupedByRole = useMemo(() => {
    const groups: Record<string, any[]> = { ADMIN: [], PASTOR: [], CLUB_ADMIN: [], USER: [] };
    filtered.forEach(u => {
      if (groups[u.role]) groups[u.role].push(u);
      else groups.USER.push(u);
    });
    return groups;
  }, [filtered]);

  const pendingCount = users.filter(u => !u.is_approved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">회원 관리</h1>
          <p className="text-xs text-[#999] mt-1">총 {users.length}명 · 승인 대기 {pendingCount}명</p>
        </div>
        <div className="flex gap-2 bg-white border border-[#EEE] rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${view === 'list' ? 'bg-[#1E5631] text-white' : 'text-[#666]'}`}
          >
            <Users className="w-4 h-4" /> 목록
          </button>
          <button
            onClick={() => setView('tree')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${view === 'tree' ? 'bg-[#1E5631] text-white' : 'text-[#666]'}`}
          >
            <Network className="w-4 h-4" /> 조직도
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white border border-[#EEE] rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f.key ? 'bg-[#1E5631] text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
            >
              {f.label}{f.key === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="input-field pl-9" placeholder="이름 또는 연락처 검색" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field max-w-xs" value={clubFilter} onChange={e => setClubFilter(e.target.value)}>
            <option value="all">전체 동아리</option>
            {allClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EEE] p-16 text-center text-[#999]">로딩 중...</div>
      ) : view === 'list' ? (
        /* ===== 목록 뷰 ===== */
        <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F7F7]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">이름</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">연락처</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">부서</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">소속 동아리</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">등급</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">가입일</th>
                  <th className="px-4 py-3 text-left font-medium text-[#666]">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-[#999]">조건에 맞는 회원이 없습니다</td></tr>
                ) : filtered.map((u: any) => {
                  const r = ROLES[u.role] || ROLES.USER;
                  return (
                    <tr key={u.id} className={`hover:bg-[#F7F7F7] ${!u.is_approved ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium">
                        {editingId === u.id ? (
                          <input className="input-field text-xs py-1 px-2" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="이름" />
                        ) : u.name}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {editingId === u.id ? (
                          <input className="input-field text-xs py-1 px-2" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="010-0000-0000" />
                        ) : (u.phone || '-')}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {editingId === u.id ? (
                          <input className="input-field text-xs py-1 px-2" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="부서" />
                        ) : (u.department || '-')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {u.clubs?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.clubs.map((c: any) => (
                              <span key={c.club_id} className="inline-block px-2 py-0.5 bg-[#F1F8E9] text-[#1E5631] rounded-full text-[10px]">
                                {c.club_icon} {c.club_name}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-[#BDBDBD]">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium"
                          style={{ backgroundColor: r.bg, color: r.color }}
                        >
                          <option value="ADMIN">관리자</option>
                          <option value="PASTOR">교역자</option>
                          <option value="CLUB_ADMIN">동아리운영자</option>
                          <option value="USER">일반회원</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_approved ? (
                          <span className="flex items-center gap-1 text-xs text-[#4CAF50]">
                            <CheckCircle className="w-3 h-3" /> 승인
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-[#FF9800]">
                            <Clock className="w-3 h-3" /> 대기
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#999]">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <div className="flex gap-1">
                            <button onClick={saveEdit} className="px-2 py-1 bg-[#1E5631] text-white rounded text-xs">저장</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-[#F5F5F5] text-[#666] rounded text-xs">취소</button>
                          </div>
                        ) : !u.is_approved && u.role !== 'ADMIN' ? (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => handleApprove(u.id)} className="flex items-center gap-1 px-2 py-1 bg-[#1E5631] text-white rounded text-xs">
                              <CheckCircle className="w-3 h-3" /> 승인
                            </button>
                            <button onClick={() => handleReject(u.id)} className="flex items-center gap-1 px-2 py-1 bg-[#E53935] text-white rounded text-xs">
                              <XCircle className="w-3 h-3" /> 거절
                            </button>
                            <button onClick={() => startEdit(u)} className="px-2 py-1 bg-[#F5F5F5] text-[#666] rounded text-xs">수정</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(u)} className="px-2 py-1 bg-[#F5F5F5] text-[#666] rounded text-xs hover:bg-[#E0E0E0]">수정</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ===== 조직도 뷰 ===== */
        <div className="bg-white rounded-2xl border border-[#EEE] p-6">
          <div className="flex flex-col items-center gap-4">
            {(['ADMIN', 'PASTOR', 'CLUB_ADMIN', 'USER'] as const).map((roleKey, idx) => {
              const r = ROLES[roleKey];
              const list = groupedByRole[roleKey];
              const Icon = r.icon;
              return (
                <div key={roleKey} className="w-full">
                  {/* 등급 헤더 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm" style={{ backgroundColor: r.bg, color: r.color }}>
                      <Icon className="w-4 h-4" /> {r.label}
                      <span className="text-xs opacity-80">({list.length}명)</span>
                    </div>
                    <div className="flex-1 h-[1px] bg-[#EEE]" />
                  </div>
                  {/* 회원 카드 그리드 */}
                  {list.length === 0 ? (
                    <p className="text-xs text-[#BDBDBD] text-center py-3 mb-4">해당 등급 회원이 없습니다</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 ml-4">
                      {list.map((u: any) => (
                        <div key={u.id} className="border border-[#EEE] rounded-xl p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: r.bg, color: r.color }}>
                              {u.name?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1A1A1A] truncate">{u.name}</p>
                              <p className="text-[10px] text-[#999] truncate">{u.phone || '-'}</p>
                            </div>
                          </div>
                          {u.clubs?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {u.clubs.slice(0, 3).map((c: any) => (
                                <span key={c.club_id} className="text-[9px] bg-[#F1F8E9] text-[#1E5631] px-1.5 py-0.5 rounded-full">
                                  {c.club_icon}
                                </span>
                              ))}
                              {u.clubs.length > 3 && (
                                <span className="text-[9px] text-[#999]">+{u.clubs.length - 3}</span>
                              )}
                            </div>
                          )}
                          {!u.is_approved && (
                            <span className="inline-block mt-2 text-[9px] bg-orange-50 text-[#FF9800] px-1.5 py-0.5 rounded-full">대기</span>
                          )}
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="w-full mt-2 text-[10px] px-2 py-1 border border-[#EEE] rounded cursor-pointer"
                          >
                            <option value="ADMIN">관리자</option>
                            <option value="PASTOR">교역자</option>
                            <option value="CLUB_ADMIN">동아리운영자</option>
                            <option value="USER">일반회원</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 계층 구분선 (마지막 제외) */}
                  {idx < 3 && (
                    <div className="flex justify-center mb-3">
                      <div className="w-[2px] h-6 bg-[#1E5631]/20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

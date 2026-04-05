'use client';

import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';

const ROLES: Record<string, string> = { USER: '일반', CLUB_ADMIN: '동아리 관리자', ADMIN: '관리자' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => setUsers(d.recentUsers || [])).catch(() => {});
  }, []);

  const handleApprove = async (userId: number) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_approved: 1 } : u));
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('이 회원을 거절하시겠습니까?')) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const filtered = users.filter(u => {
    if (search && !u.name.includes(search) && !u.phone?.includes(search)) return false;
    if (filter === 'pending' && u.is_approved) return false;
    if (filter === 'approved' && !u.is_approved) return false;
    return true;
  });

  const pendingCount = users.filter(u => !u.is_approved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">회원 관리</h1>
        {pendingCount > 0 && (
          <span className="bg-[#E53935] text-white px-3 py-1 rounded-full text-sm font-medium">
            승인 대기 {pendingCount}명
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input-field pl-9" placeholder="이름 또는 연락처 검색" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: '전체' },
            { key: 'pending' as const, label: `승인 대기${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { key: 'approved' as const, label: '승인 완료' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f.key ? 'bg-[#1E5631] text-white' : 'bg-white border border-[#EEE] text-[#666]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F7]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#666]">이름</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">연락처</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">부서</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">가입경로</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">역할</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">상태</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">가입일</th>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-32">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {filtered.map((user: any) => (
              <tr key={user.id} className={`hover:bg-[#F7F7F7] ${!user.is_approved ? 'bg-orange-50/30' : ''}`}>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-[#666]">{user.phone || '-'}</td>
                <td className="px-4 py-3 text-[#666]">{user.department || '-'}</td>
                <td className="px-4 py-3 text-[#666]">{user.referral_source || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-[#1E5631] text-white' : user.role === 'CLUB_ADMIN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#666]'}`}>
                    {ROLES[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.is_approved ? (
                    <span className="flex items-center gap-1 text-xs text-[#4CAF50]">
                      <CheckCircle className="w-3 h-3" /> 승인
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[#FF9800]">
                      <Clock className="w-3 h-3" /> 대기
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#999]">{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {!user.is_approved && user.role !== 'ADMIN' ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleApprove(user.id)} className="flex items-center gap-1 px-2 py-1 bg-[#1E5631] text-white rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> 승인
                      </button>
                      <button onClick={() => handleReject(user.id)} className="flex items-center gap-1 px-2 py-1 bg-[#E53935] text-white rounded text-xs">
                        <XCircle className="w-3 h-3" /> 거절
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#BDBDBD]">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

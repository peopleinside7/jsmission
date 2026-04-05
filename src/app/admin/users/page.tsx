'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

const ROLES: Record<string, string> = { USER: '일반', CLUB_ADMIN: '동아리 관리자', ADMIN: '관리자' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => setUsers(d.recentUsers || []));
  }, []);

  const filtered = search ? users.filter(u => u.name.includes(search) || u.email.includes(search)) : users;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">회원 관리</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="input-field pl-9" placeholder="이름 또는 이메일 검색" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F7]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#666]">이름</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">부서</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">역할</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {filtered.map((user: any) => (
              <tr key={user.id} className="hover:bg-[#F7F7F7]">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-[#666]">{user.email}</td>
                <td className="px-4 py-3 text-[#666]">{user.department || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-[#1E5631] text-white' : user.role === 'CLUB_ADMIN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#666]'}`}>
                    {ROLES[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#999]">{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => {
      const clubList = d.clubs || [];
      setClubs(clubList);
      // Fetch applications for all actual clubs
      Promise.all(
        clubList.map((c: any) => fetch(`/api/clubs/${c.id}/apply`).then(r => r.json()).catch(() => ({ applications: [] })))
      ).then(results => {
        setApplications(results.flatMap(r => r.applications || []));
      });
    }).catch(() => {});
  }, []);

  const handleApprove = async (appId: number) => {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    if (res.ok) {
      setApplications(applications.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
    }
  };

  const handleReject = async (appId: number) => {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    if (res.ok) {
      setApplications(applications.map(a => a.id === appId ? { ...a, status: 'REJECTED' } : a));
    }
  };

  const pendingApps = applications.filter(a => a.status === 'PENDING');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">동아리 관리</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#EEE]">
        {['동아리 목록', `신청 관리 ${pendingApps.length > 0 ? `(${pendingApps.length})` : ''}`].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`pb-3 text-sm font-medium border-b-2 ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#666]">동아리</th>
                <th className="px-4 py-3 text-left font-medium text-[#666]">카테고리</th>
                <th className="px-4 py-3 text-left font-medium text-[#666]">멤버</th>
                <th className="px-4 py-3 text-left font-medium text-[#666]">신입생</th>
                <th className="px-4 py-3 text-left font-medium text-[#666]">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {clubs.map(club => (
                <tr key={club.id} className="hover:bg-[#F7F7F7]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{club.icon}</span>
                      <span className="font-medium">{club.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#666]">{club.category}</td>
                  <td className="px-4 py-3">{club.member_count || 0}</td>
                  <td className="px-4 py-3">{club.newcomer_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${club.recruitment_status === 'OPEN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#999]'}`}>
                      {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-16 text-[#999]">신청 내역이 없습니다</div>
          ) : applications.map(app => (
            <div key={app.id} className="bg-white rounded-2xl border border-[#EEE] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{app.user_name}</p>
                  <p className="text-xs text-[#999]">{app.club_name} / {app.department}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${app.status === 'PENDING' ? 'bg-orange-50 text-[#FF9800]' : app.status === 'APPROVED' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-red-50 text-[#E53935]'}`}>
                  {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : '거절'}
                </span>
              </div>
              {app.purpose && <p className="text-sm text-[#666] mb-2">{app.purpose}</p>}
              {app.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(app.id)} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E5631] text-white rounded-lg text-xs">
                    <CheckCircle className="w-3 h-3" /> 승인
                  </button>
                  <button onClick={() => handleReject(app.id)} className="flex items-center gap-1 px-3 py-1.5 bg-[#E53935] text-white rounded-lg text-xs">
                    <XCircle className="w-3 h-3" /> 거절
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Send, Bell, Users } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showSend, setShowSend] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', link: '', target: 'all' });
  const [sending, setSending] = useState(false);

  const load = () => {
    fetch('/api/admin/notifications', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setNotifs(d.notifications || []); setTotalUsers(d.totalUsers || 0); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '발송 실패'); return; }
      alert(`${data.count}명에게 알림을 발송했습니다`);
      setShowSend(false);
      setForm({ title: '', message: '', link: '', target: 'all' });
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">알림 관리</h1>
          <p className="text-xs text-[#999] mt-1">전체 사용자 또는 특정 등급에게 푸시 알림 발송</p>
        </div>
        <button onClick={() => setShowSend(true)} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" /> 알림 발송
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#1E5631]" />
            <span className="text-xs text-[#999]">활성 회원</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalUsers}명</p>
        </div>
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-[#FF9800]" />
            <span className="text-xs text-[#999]">발송 내역</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{notifs.length}건</p>
        </div>
      </div>

      {/* 발송 내역 */}
      <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
        <div className="p-5 border-b border-[#EEE]">
          <h3 className="text-base font-bold">발송 내역</h3>
        </div>
        {notifs.length === 0 ? (
          <div className="p-12 text-center text-[#999]">발송된 알림이 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#666]">제목</th>
                <th className="px-4 py-3 text-left font-medium text-[#666]">메시지</th>
                <th className="px-4 py-3 text-left font-medium text-[#666] w-32">수신자 수</th>
                <th className="px-4 py-3 text-left font-medium text-[#666] w-40">발송일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {notifs.map((n, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium">{n.title}</td>
                  <td className="px-4 py-3 text-[#666] truncate max-w-md">{n.message || '-'}</td>
                  <td className="px-4 py-3 text-[#666]">{n.recipient_count}명</td>
                  <td className="px-4 py-3 text-[#999]">{new Date(n.created_at).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 발송 모달 */}
      {showSend && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSend(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">알림 발송</h3>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">발송 대상</label>
                <select className="input-field" value={form.target} onChange={e => setForm({...form, target: e.target.value})}>
                  <option value="all">전체 회원</option>
                  <option value="ADMIN">관리자만</option>
                  <option value="PASTOR">교역자만</option>
                  <option value="CLUB_ADMIN">동아리운영자만</option>
                  <option value="USER">일반회원만</option>
                </select>
              </div>
              <input className="input-field" placeholder="알림 제목" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea className="input-field min-h-[100px]" placeholder="알림 내용" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              <input className="input-field" placeholder="링크 (선택)" value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowSend(false)} className="btn-outline">취소</button>
                <button type="submit" disabled={sending} className="btn-primary">{sending ? '발송 중...' : '발송'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

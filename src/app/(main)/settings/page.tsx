'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Shield, Lock, Check } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    prayerReminder: true,
  });
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (pwForm.newPassword.length < 4) {
      setPwMsg({ type: 'error', text: '새 비밀번호는 4자 이상이어야 합니다' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' });
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다' });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowPwChange(false), 2000);
      } else {
        setPwMsg({ type: 'error', text: data.error });
      }
    } catch {
      setPwMsg({ type: 'error', text: '서버 연결에 실패했습니다' });
    } finally {
      setPwLoading(false);
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-7 rounded-full relative transition-colors ${value ? 'bg-[#1E5631]' : 'bg-[#BDBDBD]'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()} aria-label="뒤로 가기"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white">설정</h1>
      </div>

      <div className="px-4 pt-4 max-w-[640px] mx-auto">
        <div className="flex items-center justify-between py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#666]" />
            <span className="text-sm">알림 설정</span>
          </div>
          <Toggle value={settings.notifications} onChange={() => setSettings({ ...settings, notifications: !settings.notifications })} />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#666]" />
            <span className="text-sm">기도 리마인더</span>
          </div>
          <Toggle value={settings.prayerReminder} onChange={() => setSettings({ ...settings, prayerReminder: !settings.prayerReminder })} />
        </div>

        {/* Password Change */}
        <button
          onClick={() => setShowPwChange(!showPwChange)}
          className="w-full flex items-center justify-between py-4 border-b border-[#F5F5F5]"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#666]" />
            <span className="text-sm">비밀번호 변경</span>
          </div>
          <ChevronLeft className={`w-4 h-4 text-[#999] transition-transform ${showPwChange ? 'rotate-[-90deg]' : 'rotate-180'}`} />
        </button>

        {showPwChange && (
          <form onSubmit={handleChangePassword} className="py-4 space-y-3">
            {pwMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${pwMsg.type === 'error' ? 'bg-red-50 text-[#E53935]' : 'bg-[#E8F5E9] text-[#1E5631]'}`}>
                {pwMsg.text}
              </div>
            )}
            <input
              type="password" className="input-field" placeholder="현재 비밀번호"
              value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
            <input
              type="password" className="input-field" placeholder="새 비밀번호 (4자 이상)"
              value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required minLength={4}
            />
            <input
              type="password" className="input-field" placeholder="새 비밀번호 확인"
              value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
            <button type="submit" disabled={pwLoading} className="btn-primary w-full">
              {pwLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

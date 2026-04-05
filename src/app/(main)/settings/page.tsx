'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Moon, Shield } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    prayerReminder: true,
  });

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-7 rounded-full relative transition-colors ${value ? 'bg-[#1E5631]' : 'bg-[#BDBDBD]'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white">설정</h1>
      </div>

      <div className="px-4 pt-4 max-w-[640px] mx-auto space-y-1">
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
      </div>
    </div>
  );
}

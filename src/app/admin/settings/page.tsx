'use client';

import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    app_name: '',
    app_description: '',
    contact_phone: '',
    contact_email: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings(d.settings); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString('ko-KR'));
        alert('설정이 저장되었습니다');
      } else {
        alert('저장 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">설정</h1>
          <p className="text-xs text-[#999] mt-1">앱 기본 정보 및 연락처</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* 앱 기본 정보 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> 앱 기본 정보
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#666] mb-1.5 block">앱 이름</label>
              <input className="input-field" value={settings.app_name || ''} onChange={e => update('app_name', e.target.value)} placeholder="JS MISSION" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#666] mb-1.5 block">앱 설명</label>
              <input className="input-field" value={settings.app_description || ''} onChange={e => update('app_description', e.target.value)} placeholder="안산주성령교회 문화선교 플랫폼" />
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-4">연락처 정보</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#666] mb-1.5 block">대표 연락처</label>
              <input className="input-field" value={settings.contact_phone || ''} onChange={e => update('contact_phone', e.target.value)} placeholder="031-000-0000" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#666] mb-1.5 block">대표 이메일</label>
              <input className="input-field" type="email" value={settings.contact_email || ''} onChange={e => update('contact_email', e.target.value)} placeholder="info@example.com" />
            </div>
          </div>
        </div>

        {savedAt && <p className="text-xs text-[#4CAF50] text-right">마지막 저장: {savedAt}</p>}
      </div>
    </div>
  );
}

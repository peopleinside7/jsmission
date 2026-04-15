'use client';

import { useEffect, useState } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';

export default function AdminContentPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    banner_image: '',
    welcome_message: '',
    app_description: '',
    footer_text: '',
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
        alert('저장되었습니다');
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">콘텐츠 관리</h1>
          <p className="text-xs text-[#999] mt-1">메인 배너, 환영 메시지, 앱 소개글 편집</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 메인 배너 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> 메인 배너
          </h3>
          <input
            className="input-field"
            placeholder="배너 이미지 URL (예: /banner.jpg)"
            value={settings.banner_image || ''}
            onChange={e => update('banner_image', e.target.value)}
          />
          {settings.banner_image && (
            <div className="mt-3 border border-[#EEE] rounded-lg overflow-hidden bg-[#F8F8F8]">
              <img src={settings.banner_image} alt="배너 미리보기" className="w-full h-32 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        {/* 환영 메시지 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5">
          <h3 className="text-base font-bold mb-3">환영 메시지</h3>
          <input
            className="input-field"
            placeholder="홈 화면 환영 문구"
            value={settings.welcome_message || ''}
            onChange={e => update('welcome_message', e.target.value)}
          />
        </div>

        {/* 앱 소개 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-bold mb-3">앱 소개글</h3>
          <textarea
            className="input-field min-h-[120px]"
            placeholder="앱 소개 문구"
            value={settings.app_description || ''}
            onChange={e => update('app_description', e.target.value)}
          />
        </div>

        {/* 푸터 */}
        <div className="bg-white border border-[#EEE] rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-bold mb-3">하단 푸터 문구</h3>
          <input
            className="input-field"
            placeholder="© 2025 ..."
            value={settings.footer_text || ''}
            onChange={e => update('footer_text', e.target.value)}
          />
        </div>
      </div>

      {savedAt && <p className="text-xs text-[#4CAF50] mt-4 text-right">마지막 저장: {savedAt}</p>}
    </div>
  );
}

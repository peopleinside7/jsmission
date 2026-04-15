'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Save, User as UserIcon } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '', department: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setForm({ name: d.user.name || '', phone: d.user.phone || '', department: d.user.department || '' });
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('이름은 필수입니다'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '저장 실패'); return; }
      setUser({
        userId: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
      } as any);
      alert('프로필이 수정되었습니다');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/profile-edit"><h1 className="text-base font-bold text-white flex-1">프로필 수정</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="page-container pt-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto">
            <UserIcon className="w-10 h-10 text-[#1E5631]" />
          </div>
          <p className="text-xs text-[#999] mt-2">{user?.role === 'ADMIN' ? '관리자' : user?.role === 'CLUB_ADMIN' ? '동아리 관리자' : '일반 회원'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">이름 *</label>
            <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">연락처</label>
            <input className="input-field" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="010-0000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">소속부서</label>
            <input className="input-field" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="예: 청년부" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Mode = 'login' | 'register' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    phone: '', password: '', name: '', department: '', referral_source: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setSuccess('회원가입 신청이 완료되었습니다!\n관리자 승인 후 로그인할 수 있습니다.');
        setMode('login');
        setForm({ ...form, name: '', department: '', referral_source: '' });
      } else if (mode === 'reset') {
        if (!form.phone) { setError('연락처를 입력해주세요'); return; }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setSuccess(`임시 비밀번호: ${data.tempPassword}\n이 비밀번호로 로그인 후 변경해주세요.`);
        setMode('login');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        router.push('/home');
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Image src="/logo_r.png" alt="JS MISSION" width={100} height={100} className="rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E5631]">JS MISSION</h1>
          <p className="text-sm text-[#666] mt-1">안산주성령교회 문화선교</p>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-4 p-4 bg-[#E8F5E9] border border-[#4CAF50] rounded-lg text-sm text-[#1E5631] whitespace-pre-line">
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#E53935]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">이름 *</label>
                <input type="text" required className="input-field" placeholder="이름을 입력하세요"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">소속부서</label>
                <input type="text" className="input-field" placeholder="예: 청년부, 대학부"
                  value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">가입경로</label>
                <input type="text" className="input-field" placeholder="예: 교회 소개, 지인 추천, 인스타그램"
                  value={form.referral_source} onChange={(e) => setForm({ ...form, referral_source: e.target.value })} />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">연락처 *</label>
            <input type="tel" required className="input-field" placeholder="010-0000-0000"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="text-sm font-medium text-[#333] mb-1.5 block">비밀번호 *</label>
              <input type="password" required minLength={4} className="input-field"
                placeholder="비밀번호를 입력하세요"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? '처리 중...' : mode === 'register' ? '가입 신청' : mode === 'reset' ? '임시 비밀번호 발급' : '로그인'}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('register')} className="text-sm text-[#666] hover:text-[#1E5631] block w-full">
                계정이 없으신가요? 가입 신청
              </button>
              <button onClick={() => switchMode('reset')} className="text-sm text-[#999] hover:text-[#1E5631] block w-full">
                비밀번호를 잊으셨나요?
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => switchMode('login')} className="text-sm text-[#666] hover:text-[#1E5631]">
              이미 계정이 있으신가요? 로그인
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => switchMode('login')} className="text-sm text-[#666] hover:text-[#1E5631]">
              로그인으로 돌아가기
            </button>
          )}
        </div>

        {mode === 'register' && (
          <div className="mt-4 p-3 bg-[#F1F8E9] rounded-xl">
            <p className="text-xs text-[#666] text-center">
              가입 신청 후 관리자 승인이 완료되면 로그인할 수 있습니다
            </p>
          </div>
        )}

        {mode === 'reset' && (
          <div className="mt-4 p-3 bg-[#FFF3E0] rounded-xl">
            <p className="text-xs text-[#666] text-center">
              등록된 연락처로 임시 비밀번호가 발급됩니다
            </p>
          </div>
        )}

        {/* Demo accounts */}
        <div className="mt-8 p-4 bg-[#F7F7F7] rounded-xl">
          <p className="text-xs text-[#999] text-center mb-2">테스트 계정</p>
          <p className="text-xs text-[#666] text-center">Admin: 010-0000-0000 / admin1234</p>
          <p className="text-xs text-[#666] text-center">User: 010-1111-1111 / test1234</p>
        </div>
      </div>
    </div>
  );
}

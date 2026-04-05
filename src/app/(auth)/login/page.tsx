'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', department: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? form : { email: form.email, password: form.password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다');
        return;
      }
      router.push('/home');
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setLoading(false);
    }
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

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#E53935]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">이름</label>
                <input
                  type="text" required
                  className="input-field"
                  placeholder="이름을 입력하세요"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">연락처</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">소속부서</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 청년부, 대학부"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">이메일</label>
            <input
              type="email" required
              className="input-field"
              placeholder="이메일을 입력하세요"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#333] mb-1.5 block">비밀번호</label>
            <input
              type="password" required minLength={6}
              className="input-field"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? '처리 중...' : isRegister ? '회원가입' : '로그인'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm text-[#666] hover:text-[#1E5631]"
          >
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>

        {/* Demo accounts info */}
        <div className="mt-8 p-4 bg-[#F7F7F7] rounded-xl">
          <p className="text-xs text-[#999] text-center mb-2">테스트 계정</p>
          <p className="text-xs text-[#666] text-center">Admin: admin@jsmission.kr / admin1234</p>
          <p className="text-xs text-[#666] text-center">User: user1@test.com / test1234</p>
        </div>
      </div>
    </div>
  );
}

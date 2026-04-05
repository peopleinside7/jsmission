'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Lock } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    fetch('/api/boards/FEEDBACK').then(r => r.json()).then(d => setFeedbacks(d.posts || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/boards/FEEDBACK', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setFeedbacks([data.post, ...feedbacks]);
      setShowWrite(false);
      setForm({ title: '', content: '' });
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white flex-1">Feedback</h1>
        <button onClick={() => setShowWrite(true)} className="text-white"><Plus className="w-6 h-6" /></button>
      </div>

      <div className="page-container pt-2">
        <div className="flex items-center gap-2 py-3 text-xs text-[#999]">
          <Lock className="w-3 h-3" />
          <span>비공개 게시판 — 작성자와 관리자만 열람 가능합니다</span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-16 text-[#999]">
            <p className="text-4xl mb-3">💡</p>
            <p className="text-sm">아직 피드백이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedbacks.map(fb => (
              <div key={fb.id} className="card p-4">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{fb.title}</p>
                <p className="text-xs text-[#666] line-clamp-2">{fb.content}</p>
                <p className="text-xs text-[#BDBDBD] mt-2">{new Date(fb.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWrite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowWrite(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Feedback 작성</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field min-h-[120px]" placeholder="피드백을 자유롭게 작성해주세요" required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWrite(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

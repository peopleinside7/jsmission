'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ChevronLeft, Plus, Lock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch('/api/boards/FEEDBACK').then(r => r.json()).then(d => setFeedbacks(d.posts || [])).catch(() => {});
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

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    // 댓글 로드
    if (!comments[id]) {
      fetch(`/api/posts/${id}/comments`).then(r => r.json()).then(d => {
        setComments(prev => ({ ...prev, [id]: d.comments || [] }));
      }).catch(() => {});
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) setFeedbacks(feedbacks.filter(fb => fb.id !== id));
  };

  const submitComment = async (postId: number) => {
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      setNewComment('');
      // 댓글 새로고침
      fetch(`/api/posts/${postId}/comments`).then(r => r.json()).then(d => {
        setComments(prev => ({ ...prev, [postId]: d.comments || [] }));
      }).catch(() => {});
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/feedback"><h1 className="text-base font-bold text-white flex-1">Feedback</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="page-container pt-2">
        <div className="flex items-center gap-2 py-3 text-xs text-[#999]">
          <Lock className="w-3 h-3" />
          <span>비공개 — 작성자와 관리자만 열람 가능합니다</span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-16 text-[#999]">
            <p className="text-4xl mb-3">💡</p>
            <p className="text-sm">아직 피드백이 없습니다</p>
            <p className="text-xs text-[#BDBDBD] mt-1">하단 작성하기 버튼을 눌러 피드백을 작성해보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedbacks.map(fb => (
              <div key={fb.id} className="card overflow-hidden">
                {/* 피드백 본문 */}
                <button onClick={() => toggleExpand(fb.id)} className="w-full p-4 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1A1A1A] flex-1">{fb.title}</p>
                    {(fb.author_id === user?.userId || user?.role === 'ADMIN') && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleDeleteFeedback(fb.id); }}
                        className="text-[10px] text-[#BDBDBD] hover:text-[#E53935] mr-2 cursor-pointer"
                      >삭제</span>
                    )}
                    {expandedId === fb.id ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2 mt-1">{fb.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#BDBDBD]">{new Date(fb.created_at).toLocaleDateString('ko-KR')}</span>
                    {(comments[fb.id]?.length || 0) > 0 && (
                      <span className="text-[10px] text-[#1E5631] font-medium">답변 {comments[fb.id]?.length}건</span>
                    )}
                  </div>
                </button>

                {/* 확장: 댓글 목록 + 입력 */}
                {expandedId === fb.id && (
                  <div className="border-t border-[#F5F5F5] bg-[#FAFAFA]">
                    {/* 전체 내용 */}
                    <div className="p-4 border-b border-[#F0F0F0]">
                      <p className="text-sm text-[#333] whitespace-pre-wrap">{fb.content}</p>
                    </div>

                    {/* 댓글 목록 */}
                    {(comments[fb.id] || []).length > 0 && (
                      <div className="p-4 space-y-3">
                        {(comments[fb.id] || []).map((c: any) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-7 h-7 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1E5631] shrink-0">
                              {c.author_name?.[0]}
                            </div>
                            <div className="flex-1 bg-white rounded-xl p-3 border border-[#EEE]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-[#333]">{c.author_name}</span>
                                <span className="text-[10px] text-[#BDBDBD]">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                              </div>
                              <p className="text-xs text-[#555]">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 댓글 입력 */}
                    <div className="p-3 flex gap-2 border-t border-[#F0F0F0]">
                      <input
                        className="input-field flex-1 text-xs"
                        placeholder="댓글을 입력하세요"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitComment(fb.id)}
                      />
                      <button onClick={() => submitComment(fb.id)} className="w-9 h-9 bg-[#1E5631] rounded-lg flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowWrite(true)}
        className="fixed bottom-20 right-4 z-40 bg-[#4CAF50] hover:bg-[#43A047] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg shadow-[#4CAF50]/30 flex items-center gap-1.5 text-sm font-semibold"
      >
        <Plus className="w-4 h-4" />
        작성하기
      </button>

      {/* 글쓰기 모달 */}
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

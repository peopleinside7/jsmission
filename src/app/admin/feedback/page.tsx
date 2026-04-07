'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetch('/api/boards/FEEDBACK').then(r => r.json()).then(d => setFeedbacks(d.posts || [])).catch(() => {});
  }, []);

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setReplyText('');
    fetch(`/api/posts/${id}/comments`).then(r => r.json()).then(d => {
      setComments(prev => ({ ...prev, [id]: d.comments || [] }));
    }).catch(() => {});
  };

  const submitReply = async (postId: number) => {
    if (!replyText.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText }),
    });
    if (res.ok) {
      setReplyText('');
      fetch(`/api/posts/${postId}/comments`).then(r => r.json()).then(d => {
        setComments(prev => ({ ...prev, [postId]: d.comments || [] }));
      }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A1A]">피드백 관리</h1>
        <span className="text-sm text-[#999]">{feedbacks.length}건</span>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EEE] p-16 text-center text-[#999]">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[#BDBDBD]" />
          <p>등록된 피드백이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
              {/* 피드백 헤더 */}
              <button onClick={() => toggleExpand(fb.id)} className="w-full p-4 lg:p-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#FF9800] font-medium">
                        {(comments[fb.id]?.length || 0) > 0 ? '답변완료' : '답변대기'}
                      </span>
                      <span className="text-xs text-[#999]">{fb.author_name}</span>
                      <span className="text-xs text-[#BDBDBD]">{new Date(fb.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{fb.title}</p>
                    <p className="text-xs text-[#666] mt-1 line-clamp-2">{fb.content}</p>
                  </div>
                  {expandedId === fb.id ? <ChevronUp className="w-5 h-5 text-[#999] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#999] shrink-0" />}
                </div>
              </button>

              {/* 확장: 전문 + 댓글 + 답변 입력 */}
              {expandedId === fb.id && (
                <div className="border-t border-[#F0F0F0]">
                  {/* 전문 */}
                  <div className="p-4 lg:p-5 bg-[#FAFAFA]">
                    <p className="text-sm text-[#333] whitespace-pre-wrap">{fb.content}</p>
                  </div>

                  {/* 기존 댓글 */}
                  {(comments[fb.id] || []).length > 0 && (
                    <div className="p-4 lg:p-5 space-y-3 border-t border-[#F0F0F0]">
                      <p className="text-xs font-semibold text-[#666]">답변 내역</p>
                      {(comments[fb.id] || []).map((c: any) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 bg-[#1E5631] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {c.author_name?.[0]}
                          </div>
                          <div className="flex-1 bg-white rounded-xl p-3 border border-[#EEE]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">{c.author_name}</span>
                              <span className="text-[10px] text-[#BDBDBD]">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <p className="text-xs text-[#555]">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 답변 입력 */}
                  <div className="p-4 lg:p-5 border-t border-[#F0F0F0] bg-white">
                    <p className="text-xs font-semibold text-[#666] mb-2">관리자 답변</p>
                    <div className="flex gap-2">
                      <textarea
                        className="input-field flex-1 text-sm min-h-[60px]"
                        placeholder="사용자에게 답변을 작성하세요"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                      />
                      <button onClick={() => submitReply(fb.id)} className="self-end w-10 h-10 bg-[#1E5631] rounded-xl flex items-center justify-center shrink-0">
                        <Send className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

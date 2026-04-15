'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageCircle, Eye, Send } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const loadAll = () => {
      fetch(`/api/posts/${params.id}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
        setPost(d.post);
        setLiked(d.post?.is_liked || false);
        setLikeCount(d.post?.like_count || 0);
      }).catch(() => {});
      fetch(`/api/posts/${params.id}/comments`, { cache: 'no-store' })
        .then(r => r.json()).then(d => setComments(d.comments || [])).catch(() => {});
    };
    loadAll();
    const onVisible = () => { if (document.visibilityState === 'visible') loadAll(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', loadAll);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', loadAll);
    };
  }, [params.id]);

  const toggleLike = async () => {
    const res = await fetch(`/api/posts/${params.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const submitComment = async () => {
    const content = newComment.trim();
    if (!content || submitting) return;
    setSubmitting(true);

    const body: any = { content };
    if (replyTo) body.parent_id = replyTo;

    try {
      const res = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '댓글 작성 실패');
        return;
      }

      // 낙관적 업데이트: 서버 응답 댓글 즉시 UI에 반영
      const newC = {
        ...data.comment,
        author_name: data.comment.author_name || user?.name || '나',
        replies: [],
      };
      if (body.parent_id) {
        setComments(prev => prev.map(c =>
          c.id === body.parent_id ? { ...c, replies: [...(c.replies || []), newC] } : c
        ));
      } else {
        setComments(prev => [...prev, newC]);
      }
      setNewComment('');
      setReplyTo(null);

      // 서버와 동기화 (최종 정합성)
      fetch(`/api/posts/${params.id}/comments`)
        .then(r => r.json())
        .then(d => { if (d.comments) setComments(d.comments); })
        .catch(() => {});
    } catch (err) {
      alert('서버 연결 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.back();
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    await fetch(`/api/posts/${params.id}/comments/${commentId}`, { method: 'DELETE' });
    fetch(`/api/posts/${params.id}/comments`).then(r => r.json()).then(d => setComments(d.comments || [])).catch(() => {});
  };

  if (!post) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" /></div>;

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href={`/boards/${params.type}`}><h1 className="text-base font-bold text-white flex-1 truncate">{post.title}</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="px-4 pt-4 max-w-[640px] mx-auto">
        {/* Post */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">{post.title}</h2>
          <div className="flex items-center gap-3 text-xs text-[#999] mb-2">
            <span>{post.author_name}</span>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.view_count}</span>
          </div>
          {(post.author_id === user?.userId || user?.role === 'ADMIN') && (
            <div className="flex gap-3 mb-4">
              <button className="text-xs text-[#999] hover:text-[#1E5631]">수정</button>
              <button onClick={handleDeletePost} className="text-xs text-[#999] hover:text-[#E53935]">삭제</button>
            </div>
          )}
          <div className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Like */}
        <div className="flex items-center gap-4 py-3 border-y border-[#EEE] mb-4">
          <button onClick={toggleLike} className={`flex items-center gap-1 text-sm ${liked ? 'text-[#E53935]' : 'text-[#999]'}`}>
            <Heart className={`w-5 h-5 ${liked ? 'fill-current like-animate' : ''}`} />
            {likeCount}
          </button>
          <span className="flex items-center gap-1 text-sm text-[#999]">
            <MessageCircle className="w-5 h-5" />{comments.length}
          </span>
        </div>

        {/* Comments */}
        <div className="space-y-4 mb-4">
          {comments.map(comment => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center text-xs font-bold text-[#1E5631] shrink-0">
                  {comment.author_name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author_name}</span>
                    <span className="text-xs text-[#BDBDBD]">{new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-sm text-[#333] mt-0.5">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setReplyTo(comment.id)} className="text-xs text-[#999]">답글</button>
                    {(comment.author_id === user?.userId || user?.role === 'ADMIN') && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-[#999] hover:text-[#E53935]">삭제</button>
                    )}
                  </div>
                </div>
              </div>
              {/* Replies */}
              {comment.replies?.map((reply: any) => (
                <div key={reply.id} className="flex gap-3 ml-11 mt-3">
                  <div className="w-7 h-7 bg-[#F7F7F7] rounded-full flex items-center justify-center text-xs font-bold text-[#666] shrink-0">
                    {reply.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{reply.author_name}</span>
                      <span className="text-xs text-[#BDBDBD]">{new Date(reply.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-sm text-[#333] mt-0.5">{reply.content}</p>
                    {(reply.author_id === user?.userId || user?.role === 'ADMIN') && (
                      <button onClick={() => handleDeleteComment(reply.id)} className="text-xs text-[#999] hover:text-[#E53935] mt-1">삭제</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEE] p-3 z-30">
          <div className="max-w-[640px] mx-auto flex gap-2">
            {replyTo && (
              <button onClick={() => setReplyTo(null)} className="text-xs text-[#999] bg-[#F7F7F7] px-2 py-1 rounded shrink-0">
                답글 취소
              </button>
            )}
            <input
              className="input-field flex-1"
              placeholder={replyTo ? '답글을 입력하세요' : '댓글을 입력하세요'}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
            />
            <button onClick={submitComment} disabled={submitting || !newComment.trim()} className="w-10 h-10 bg-[#1E5631] rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

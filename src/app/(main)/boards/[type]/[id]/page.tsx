'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageCircle, Eye, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`).then(r => r.json()).then(d => {
      setPost(d.post);
      setLiked(d.post?.is_liked || false);
      setLikeCount(d.post?.like_count || 0);
    }).catch(() => {});
    fetch(`/api/posts/${params.id}/comments`).then(r => r.json()).then(d => setComments(d.comments || [])).catch(() => {});
  }, [params.id]);

  const toggleLike = async () => {
    const res = await fetch(`/api/posts/${params.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const body: any = { content: newComment };
    if (replyTo) body.parent_id = replyTo;
    const res = await fetch(`/api/posts/${params.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewComment('');
      setReplyTo(null);
      fetch(`/api/posts/${params.id}/comments`).then(r => r.json()).then(d => setComments(d.comments || [])).catch(() => {});
    }
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
          <div className="flex items-center gap-3 text-xs text-[#999] mb-4">
            <span>{post.author_name}</span>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.view_count}</span>
          </div>
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
                  <button onClick={() => setReplyTo(comment.id)} className="text-xs text-[#999] mt-1">답글</button>
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
            <button onClick={submitComment} className="w-10 h-10 bg-[#1E5631] rounded-xl flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

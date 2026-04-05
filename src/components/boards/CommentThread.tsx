'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, CornerDownRight } from 'lucide-react';
import type { Comment } from '@/types';
import { timeAgo } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import Skeleton from '@/components/ui/Skeleton';

interface CommentThreadProps {
  postId: number;
}

export default function CommentThread({ postId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          parent_id: replyTo?.id ?? null,
        }),
      });
      if (res.ok) {
        setContent('');
        setReplyTo(null);
        await fetchComments();
        addToast('댓글이 등록되었습니다.');
      } else {
        addToast('댓글 등록에 실패했습니다.', 'error');
      }
    } catch {
      addToast('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-8 pl-3 border-l-2 border-[#EEEEEE]' : ''}`}
    >
      <div className="py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-[#1A1A1A]">
            {comment.author_name}
          </span>
          <span className="text-xs text-[#999]">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-[#333] leading-relaxed">{comment.content}</p>
        {!isReply && (
          <button
            onClick={() =>
              setReplyTo({ id: comment.id, name: comment.author_name ?? '' })
            }
            className="mt-1 text-xs text-[#999] hover:text-[#1E5631] transition-colors flex items-center gap-1"
          >
            <CornerDownRight size={12} />
            답글
          </button>
        )}
      </div>
      {/* Replies */}
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-16 w-full" count={2} />
      </div>
    );
  }

  return (
    <div>
      {/* Comment list */}
      <div className="px-4 divide-y divide-[#EEEEEE]">
        {comments.length === 0 ? (
          <p className="text-sm text-[#999] text-center py-8">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-white border-t border-[#EEEEEE] px-4 py-3">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 px-2 py-1 bg-[#E8F5E9] rounded-lg">
            <span className="text-xs text-[#1E5631]">
              {replyTo.name}님에게 답글
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-[#999] hover:text-[#333]"
            >
              취소
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="댓글을 입력하세요..."
            className="flex-1 bg-[#F7F7F7] rounded-full px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#999] outline-none focus:ring-2 focus:ring-[#1E5631]/20"
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSending}
            className="p-2.5 rounded-full bg-[#1E5631] text-white disabled:opacity-40 hover:bg-[#2D7A3A] transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

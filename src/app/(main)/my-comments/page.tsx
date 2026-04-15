'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, MessageCircle } from 'lucide-react';

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항', SERMON: '생명의 말씀', FREE: '자유게시판',
  RESOURCE: '자료실', FEEDBACK: 'Feedback',
};

export default function MyCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/comments', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/my-comments"><h1 className="text-base font-bold text-white flex-1">내가 쓴 댓글</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="page-container pt-4">
        {loading ? (
          <div className="text-center py-12 text-[#999]">로딩 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
            <p className="text-sm text-[#999]">작성한 댓글이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map((c: any) => (
              <Link key={c.id} href={`/boards/${c.board_type}/${c.post_id}`} className="card p-4 block hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1E5631]">
                    {BOARD_LABELS[c.board_type] || c.board_type}
                  </span>
                  {c.parent_id && <span className="text-[10px] text-[#FF9800]">대댓글</span>}
                </div>
                <p className="text-sm text-[#333] mb-1">{c.content}</p>
                <div className="flex items-center gap-2 text-[10px] text-[#999]">
                  <span>📌 {c.post_title}</span>
                  <span>·</span>
                  <span>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

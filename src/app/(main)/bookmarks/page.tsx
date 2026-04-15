'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Bookmark } from 'lucide-react';

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항', SERMON: '생명의 말씀', FREE: '자유게시판',
  RESOURCE: '자료실', FEEDBACK: 'Feedback',
};

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/bookmarks', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setBookmarks(d.bookmarks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/bookmarks"><h1 className="text-base font-bold text-white flex-1">북마크</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="page-container pt-4">
        {loading ? (
          <div className="text-center py-12 text-[#999]">로딩 중...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
            <p className="text-sm text-[#999]">저장한 게시글이 없습니다</p>
            <p className="text-xs text-[#BDBDBD] mt-1">게시글 상세에서 ⭐ 버튼으로 저장할 수 있습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b: any) => (
              <Link key={b.bookmark_id} href={`/boards/${b.board_type}/${b.id}`} className="card p-4 block hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1E5631]">
                    {BOARD_LABELS[b.board_type] || b.board_type}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">{b.title}</p>
                {b.content && <p className="text-xs text-[#666] mt-1 line-clamp-2">{b.content}</p>}
                <div className="flex items-center gap-2 text-[10px] text-[#999] mt-2">
                  <span>{b.author_name}</span>
                  <span>·</span>
                  <span>{new Date(b.bookmarked_at).toLocaleDateString('ko-KR')} 저장</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

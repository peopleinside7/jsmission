'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, MessageCircle, Heart, FileText } from 'lucide-react';

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항',
  SERMON: '생명의 말씀',
  FREE: '자유게시판',
  RESOURCE: '자료실',
  FEEDBACK: 'Feedback',
};

type Post = {
  id: number;
  title: string;
  content: string;
  board_type: string;
  created_at: string;
  author_name?: string;
  comment_count?: number;
  like_count?: number;
};

export default function MyPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/posts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch { return s; }
  };

  const snippet = (content: string) => {
    if (!content) return '';
    const plain = content.replace(/\s+/g, ' ').trim();
    return plain.length > 80 ? plain.slice(0, 80) + '...' : plain;
  };

  return (
    <div className="pb-24 bg-[#F5F5F5] min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => router.back()} aria-label="뒤로가기"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white flex-1">내가 쓴 글</h1>
        <Link href="/home">
          <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
        </Link>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center py-20 text-sm text-[#999]">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
            <p className="text-sm text-[#999]">작성한 글이 없습니다</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/boards/${p.board_type}/${p.id}`}
                  className="block bg-white rounded-2xl p-4 border border-[#EEE] hover:bg-[#FAFAFA]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block text-[10px] font-bold bg-[#E8F5E9] text-[#1E5631] px-2 py-0.5 rounded-full">
                      {BOARD_LABELS[p.board_type] || p.board_type}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                  <p className="text-xs text-[#666] mt-1 line-clamp-2">{snippet(p.content)}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#999]">
                    <span>{formatDate(p.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {p.comment_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {p.like_count ?? 0}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

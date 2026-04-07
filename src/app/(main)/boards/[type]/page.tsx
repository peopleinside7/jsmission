'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, MessageCircle, Heart, Plus } from 'lucide-react';
import Image from 'next/image';

const BOARD_TITLES: Record<string, string> = {
  NOTICE: '공지사항', SERMON: '생명의 말씀', FREE: '자유게시판', FEEDBACK: 'Feedback'
};

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardType = params.type as string;
  const [posts, setPosts] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [writeForm, setWriteForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/boards/${boardType}`).then(r => r.json()).then(d => {
      setPosts(d.posts || []);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [boardType]);

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/boards/${boardType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(writeForm),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts([data.post, ...posts]);
      setShowWrite(false);
      setWriteForm({ title: '', content: '' });
    }
  };

  const canWrite = true;

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/boards/FREE"><h1 className="text-base font-bold text-white flex-1">{BOARD_TITLES[boardType] || boardType}</h1></Link>
        {canWrite && (
          <button onClick={() => setShowWrite(true)} className="text-white"><Plus className="w-6 h-6" /></button>
        )}
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="page-container pt-2">
        {loading ? (
          <div className="space-y-3 mt-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4"><div className="h-4 bg-gray-200 rounded w-3/4 skeleton-pulse" /><div className="h-3 bg-gray-200 rounded w-1/2 mt-2 skeleton-pulse" /></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-[#999]">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm">게시글이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {posts.map(post => (
              <Link key={post.id} href={`/boards/${boardType}/${post.id}`} className="block py-4">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{post.title}</p>
                <p className="text-xs text-[#999] line-clamp-2 mb-2">{post.content}</p>
                <div className="flex items-center gap-3 text-[#BDBDBD] text-xs">
                  <span>{post.author_name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.view_count}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{post.comment_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.like_count || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Write Modal */}
      {showWrite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowWrite(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">글쓰기</h3>
            <form onSubmit={handleWrite} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={writeForm.title} onChange={e => setWriteForm({ ...writeForm, title: e.target.value })} />
              <textarea className="input-field min-h-[120px]" placeholder="내용을 입력하세요" required value={writeForm.content} onChange={e => setWriteForm({ ...writeForm, content: e.target.value })} />
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

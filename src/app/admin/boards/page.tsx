'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';

const BOARD_TYPES = [
  { key: 'NOTICE', label: '공지사항' },
  { key: 'SERMON', label: '생명의 말씀' },
  { key: 'FREE', label: '자유게시판' },
  { key: 'FEEDBACK', label: 'Feedback' },
];

export default function AdminBoardsPage() {
  const [boardType, setBoardType] = useState('NOTICE');
  const [posts, setPosts] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    fetch(`/api/boards/${boardType}`).then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }, [boardType]);

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/boards/${boardType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts([data.post, ...posts]);
      setShowWrite(false);
      setForm({ title: '', content: '' });
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">게시판 관리</h1>
        <button onClick={() => setShowWrite(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 글쓰기
        </button>
      </div>

      {/* Board Type Tabs */}
      <div className="flex gap-2 mb-6">
        {BOARD_TYPES.map(bt => (
          <button
            key={bt.key}
            onClick={() => setBoardType(bt.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${boardType === bt.key ? 'bg-[#1E5631] text-white' : 'bg-white border border-[#EEE] text-[#666]'}`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F7]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-12">ID</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">제목</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">작성자</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">조회</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">날짜</th>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-20">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-[#F7F7F7]">
                <td className="px-4 py-3 text-[#999]">{post.id}</td>
                <td className="px-4 py-3 font-medium">{post.title}</td>
                <td className="px-4 py-3 text-[#666]">{post.author_name}</td>
                <td className="px-4 py-3 text-[#666]">{post.view_count}</td>
                <td className="px-4 py-3 text-[#999]">{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(post.id)} className="text-[#E53935] hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Write Modal */}
      {showWrite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowWrite(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{BOARD_TYPES.find(b => b.key === boardType)?.label} 글쓰기</h3>
            <form onSubmit={handleWrite} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field min-h-[200px]" placeholder="내용" required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowWrite(false)} className="btn-outline">취소</button>
                <button type="submit" className="btn-primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Eye, Search, Pin, MessageSquare, X } from 'lucide-react';

// 모든 게시판 (자료실은 RESOURCE + category로 분리)
const BOARD_TABS: Array<{ key: string; type: string; category?: string; label: string }> = [
  { key: 'NOTICE', type: 'NOTICE', label: '공지사항' },
  { key: 'SERMON', type: 'SERMON', label: '생명의 말씀' },
  { key: 'FREE', type: 'FREE', label: '자유게시판' },
  { key: 'RESOURCE-promo', type: 'RESOURCE', category: '동아리 홍보지', label: '동아리 홍보지' },
  { key: 'RESOURCE-share', type: 'RESOURCE', category: '자료 공유', label: '자료 공유' },
  { key: 'RESOURCE-mission', type: 'RESOURCE', category: '선교 item', label: '선교 item' },
  { key: 'FEEDBACK', type: 'FEEDBACK', label: 'Feedback' },
];

export default function AdminBoardsPage() {
  const [activeTab, setActiveTab] = useState(BOARD_TABS[0].key);
  const [posts, setPosts] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [previewComments, setPreviewComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currentTab = BOARD_TABS.find(t => t.key === activeTab)!;

  const loadPosts = useCallback(() => {
    setLoading(true);
    const url = currentTab.category
      ? `/api/boards/${currentTab.type}?category=${encodeURIComponent(currentTab.category)}`
      : `/api/boards/${currentTab.type}`;
    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setSelectedIds(new Set()); })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [currentTab]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { ...form };
    if (currentTab.category) body.resource_category = currentTab.category;
    const res = await fetch(`/api/boards/${currentTab.type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts([data.post, ...posts]);
      setShowWrite(false);
      setForm({ title: '', content: '' });
    } else {
      const data = await res.json();
      alert(data.error || '글쓰기 실패');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts(posts.filter(p => p.id !== postId));
    else alert('삭제 실패');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개 글을 삭제하시겠습니까?`)) return;
    const res = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
    });
    if (res.ok) {
      setPosts(posts.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } else {
      const d = await res.json();
      alert(d.error || '일괄 삭제 실패');
    }
  };

  const handlePin = async (post: any) => {
    const res = await fetch('/api/admin/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, pinned: !post.is_pinned }),
    });
    if (res.ok) loadPosts();
    else alert('핀 고정 실패');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPosts.map(p => p.id)));
  };

  const openPreview = async (post: any) => {
    setPreviewPost(post);
    fetch(`/api/posts/${post.id}/comments`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setPreviewComments(d.comments || []))
      .catch(() => setPreviewComments([]));
  };

  const handleDeletePreviewComment = async (commentId: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${previewPost.id}/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) {
      setPreviewComments(previewComments.filter(c => c.id !== commentId));
    }
  };

  // 검색 필터링
  const filteredPosts = posts.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title?.toLowerCase().includes(q) || p.author_name?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">게시판 관리</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="bg-[#E53935] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> 선택 삭제 ({selectedIds.size})
            </button>
          )}
          <button onClick={() => setShowWrite(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 글쓰기
          </button>
        </div>
      </div>

      {/* Board Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {BOARD_TABS.map(bt => (
          <button
            key={bt.key}
            onClick={() => setActiveTab(bt.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === bt.key ? 'bg-[#1E5631] text-white' : 'bg-white border border-[#EEE] text-[#666] hover:border-[#1E5631]'}`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          className="input-field pl-9"
          placeholder="제목 또는 작성자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-[#EEE] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F7]">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filteredPosts.length > 0 && selectedIds.size === filteredPosts.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-3 py-3 text-left font-medium text-[#666] w-10">📌</th>
              <th className="px-3 py-3 text-left font-medium text-[#666] w-12">ID</th>
              <th className="px-4 py-3 text-left font-medium text-[#666]">제목</th>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-32">작성자</th>
              <th className="px-3 py-3 text-left font-medium text-[#666] w-20">조회</th>
              <th className="px-3 py-3 text-left font-medium text-[#666] w-20">댓글</th>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-32">날짜</th>
              <th className="px-4 py-3 text-left font-medium text-[#666] w-32">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-[#999]">로딩 중...</td></tr>
            ) : filteredPosts.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-[#999]">게시글이 없습니다</td></tr>
            ) : filteredPosts.map(post => (
              <tr key={post.id} className={`hover:bg-[#F7F7F7] ${post.is_pinned ? 'bg-[#FFFEF0]' : ''}`}>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => handlePin(post)} title={post.is_pinned ? '고정 해제' : '상단 고정'}>
                    <Pin className={`w-4 h-4 ${post.is_pinned ? 'text-[#FF9800] fill-current' : 'text-[#BDBDBD]'}`} />
                  </button>
                </td>
                <td className="px-3 py-3 text-[#999]">{post.id}</td>
                <td className="px-4 py-3 font-medium">
                  <button onClick={() => openPreview(post)} className="text-left hover:text-[#1E5631]">
                    {post.is_pinned && <span className="text-[#FF9800] mr-1">📌</span>}
                    {post.title}
                  </button>
                </td>
                <td className="px-4 py-3 text-[#666]">{post.author_name}</td>
                <td className="px-3 py-3 text-[#666]">{post.view_count}</td>
                <td className="px-3 py-3 text-[#666]">{post.comment_count || 0}</td>
                <td className="px-4 py-3 text-[#999]">{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openPreview(post)} className="text-[#1E5631] hover:text-[#2D7A3A]" title="상세 보기">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="text-[#E53935] hover:text-red-700" title="삭제">
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
            <h3 className="text-lg font-bold mb-4">{currentTab.label} 글쓰기</h3>
            <form onSubmit={handleWrite} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field min-h-[200px]" placeholder="내용" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowWrite(false)} className="btn-outline">취소</button>
                <button type="submit" className="btn-primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewPost(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-[#EEE] flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#1A1A1A]">{previewPost.title}</h3>
                <div className="flex gap-3 text-xs text-[#999] mt-1">
                  <span>{previewPost.author_name}</span>
                  <span>{new Date(previewPost.created_at).toLocaleString('ko-KR')}</span>
                  <span>조회 {previewPost.view_count}</span>
                </div>
              </div>
              <button onClick={() => setPreviewPost(null)} className="text-[#999] ml-3"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 flex-1">
              <div className="text-sm text-[#333] whitespace-pre-wrap mb-6">{previewPost.content}</div>

              {/* Comments */}
              <div className="border-t border-[#F0F0F0] pt-4">
                <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> 댓글 ({previewComments.length})
                </h4>
                {previewComments.length === 0 ? (
                  <p className="text-xs text-[#BDBDBD] py-4 text-center">댓글이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {previewComments.map(c => (
                      <div key={c.id} className="bg-[#FAFAFA] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E5631]">{c.author_name}</span>
                            <span className="text-[10px] text-[#BDBDBD]">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <button onClick={() => handleDeletePreviewComment(c.id)} className="text-[#E53935] hover:text-red-700" title="댓글 삭제">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-[#333]">{c.content}</p>
                        {/* 대댓글 */}
                        {c.replies?.map((r: any) => (
                          <div key={r.id} className="mt-2 ml-4 bg-white rounded p-2 border border-[#EEE]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{r.author_name}</span>
                              <button onClick={() => handleDeletePreviewComment(r.id)} className="text-[#E53935]">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-[#555]">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EEE] flex justify-between">
              <button
                onClick={() => { handlePin(previewPost); setPreviewPost({ ...previewPost, is_pinned: !previewPost.is_pinned }); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${previewPost.is_pinned ? 'bg-[#FFF3E0] text-[#FF9800]' : 'bg-[#F5F5F5] text-[#666]'}`}
              >
                <Pin className="w-4 h-4 inline mr-1" />
                {previewPost.is_pinned ? '고정 해제' : '상단 고정'}
              </button>
              <button
                onClick={() => { handleDelete(previewPost.id); setPreviewPost(null); }}
                className="bg-[#E53935] text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 inline mr-1" /> 글 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

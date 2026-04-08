'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Plus, Download, Trash2, FileText, Upload } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const CLUB_POSTERS = [
  { name: '오물오물 잉글리시', file: '/clubs/poster_1.png', icon: '🗣️' },
  { name: '여자 플로우 러닝크루', file: '/clubs/poster_2.png', icon: '🏃‍♀️' },
  { name: 'POWER F.C', file: '/clubs/poster_3.png', icon: '⚽' },
  { name: '일본어 오니기리', file: '/clubs/poster_4.png', icon: '🍙' },
  { name: '디어댄스', file: '/clubs/poster_5.png', icon: '💃' },
  { name: '캠퍼스 나침반', file: '/clubs/poster_6.png', icon: '🧭' },
  { name: 'JS 하모닉스', file: '/clubs/poster_7.png', icon: '🎵' },
];

const TABS = ['동아리 홍보지', '자료 공유', '선교 item'];

export default function ResourcesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState(0);
  const [resources, setResources] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentCategory = TABS[tab];

  useEffect(() => {
    if (tab > 0) {
      fetch(`/api/boards/RESOURCE?category=${encodeURIComponent(currentCategory)}`)
        .then(r => r.json())
        .then(d => setResources(d.posts || []))
        .catch(() => setResources([]));
    }
  }, [tab, currentCategory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title) return;
    setUploading(true);

    let filePath = '';
    let fileName = '';

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        filePath = uploadData.filePath;
        fileName = uploadData.fileName;
      }
    }

    const res = await fetch('/api/boards/RESOURCE', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: uploadForm.title,
        content: null,
        resource_category: currentCategory,
        file_path: filePath,
        file_name: fileName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResources([data.post, ...resources]);
      setShowUpload(false);
      setUploadForm({ title: '', category: '' });
      setSelectedFile(null);
    }
    setUploading(false);
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setResources(resources.filter(r => r.id !== postId));
  };

  return (
    <div className="pb-24">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/resources"><h1 className="text-base font-bold text-white flex-1">자료실</h1></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="bg-white border-b border-[#EEE] flex">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`flex-1 py-3 text-xs font-medium border-b-2 ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}>{t}</button>
        ))}
      </div>

      <div className="page-container pt-4">
        {/* Tab 0: 동아리 홍보지 */}
        {tab === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {CLUB_POSTERS.map((p, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="relative w-full aspect-[4/3] bg-[#F8F8F8]">
                  <Image src={p.file} alt={p.name} fill className="object-contain" sizes="180px" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#333]">{p.icon} {p.name}</p>
                  </div>
                  <a href={p.file} download className="w-7 h-7 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                    <Download className="w-3.5 h-3.5 text-[#1E5631]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1,2: 자료 공유 / 선교 item */}
        {tab > 0 && (
          <>
            {resources.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
                <p className="text-sm text-[#999]">등록된 자료가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((r: any) => (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A]">{r.title}</p>
                        {r.content && <p className="text-xs text-[#666] mt-0.5">{r.content}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-[#999]">{r.author_name}</span>
                          <span className="text-[10px] text-[#BDBDBD]">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {r.file_path && (
                          <a href={r.file_path} download className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                            <Download className="w-4 h-4 text-[#1E5631]" />
                          </a>
                        )}
                        {(r.author_id === user?.userId || user?.role === 'ADMIN') && (
                          <button onClick={() => handleDelete(r.id)} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-4 h-4 text-[#E53935]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB - 등록하기 */}
      {tab > 0 && (
        <button
          onClick={() => setShowUpload(true)}
          className="fixed bottom-20 right-4 z-40 bg-[#4CAF50] hover:bg-[#43A047] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg shadow-[#4CAF50]/30 flex items-center gap-1.5 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          등록하기
        </button>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowUpload(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{currentCategory} 등록</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <input className="input-field" placeholder="제목(설명)" required
                value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} />
              <div className="border-2 border-dashed border-[#E0E0E0] rounded-xl p-4 text-center">
                <input
                  type="file"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#666]"
                />
                {selectedFile ? (
                  <p className="text-xs text-[#1E5631] mt-1 font-medium">{selectedFile.name}</p>
                ) : (
                  <p className="text-xs text-[#999] mt-1">파일을 선택하세요 (최대 20MB)</p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1">
                  {uploading ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

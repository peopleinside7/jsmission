'use client';

import { useState } from 'react';
import { ChevronLeft, Plus, Download, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const TABS = ['동아리 홍보지', '자료 공유', '선교 item'];

const CLUB_POSTERS = [
  { name: '오물오물 잉글리시', file: '/clubs/poster_1.png', icon: '🗣️' },
  { name: '여자 플로우 러닝크루', file: '/clubs/poster_2.png', icon: '🏃‍♀️' },
  { name: 'POWER F.C', file: '/clubs/poster_3.png', icon: '⚽' },
  { name: '일본어 오니기리', file: '/clubs/poster_4.png', icon: '🍙' },
  { name: '디어댄스', file: '/clubs/poster_5.png', icon: '💃' },
  { name: '캠퍼스 나침반', file: '/clubs/poster_6.png', icon: '🧭' },
  { name: 'JS 하모닉스', file: '/clubs/poster_7.png', icon: '🎵' },
];

export default function ResourcesPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [missionItems, setMissionItems] = useState<any[]>([]);

  const handleDownload = (file: string, name: string) => {
    const link = document.createElement('a');
    link.href = file;
    link.download = `${name}.png`;
    link.click();
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - would need backend
    const newItem = { id: Date.now(), title: uploadForm.title, description: uploadForm.description, created_at: new Date().toISOString() };
    if (tab === 1) {
      setSharedFiles([newItem, ...sharedFiles]);
    } else {
      setMissionItems([newItem, ...missionItems]);
    }
    setShowUpload(false);
    setUploadForm({ title: '', description: '' });
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
            {CLUB_POSTERS.map((poster, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="relative w-full aspect-[3/4] bg-[#F5F5F5]">
                  <Image
                    src={poster.file}
                    alt={poster.name}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-lg">{poster.icon}</span>
                    <p className="text-xs font-semibold text-[#333] truncate">{poster.name}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(poster.file, poster.name)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-[#1E5631] bg-[#E8F5E9] py-2 rounded-lg font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> 다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: 자료 공유 */}
        {tab === 1 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">자료 공유</h3>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs bg-[#1E5631] text-white px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 등록하기
              </button>
            </div>
            {sharedFiles.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
                <p className="text-sm text-[#999]">등록된 자료가 없습니다</p>
                <p className="text-xs text-[#BDBDBD] mt-1">상단 등록하기 버튼을 눌러 자료를 공유해보세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sharedFiles.map(f => (
                  <div key={f.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#1E5631] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{f.title}</p>
                        {f.description && <p className="text-xs text-[#999] truncate">{f.description}</p>}
                        <p className="text-[10px] text-[#BDBDBD] mt-1">{new Date(f.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: 선교 item */}
        {tab === 2 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">선교 item</h3>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs bg-[#1E5631] text-white px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 등록하기
              </button>
            </div>
            {missionItems.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
                <p className="text-sm text-[#999]">등록된 자료가 없습니다</p>
                <p className="text-xs text-[#BDBDBD] mt-1">상단 등록하기 버튼을 눌러 자료를 등록해보세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {missionItems.map(f => (
                  <div key={f.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#1E5631] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{f.title}</p>
                        {f.description && <p className="text-xs text-[#999] truncate">{f.description}</p>}
                        <p className="text-[10px] text-[#BDBDBD] mt-1">{new Date(f.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowUpload(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{tab === 1 ? '자료 등록' : '선교 item 등록'}</h3>
              <button onClick={() => setShowUpload(false)}><X className="w-5 h-5 text-[#999]" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <input className="input-field" placeholder="제목" required value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} />
              <textarea className="input-field min-h-[80px]" placeholder="설명" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" className="btn-primary flex-1">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

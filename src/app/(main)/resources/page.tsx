'use client';

import { useState } from 'react';
import { ChevronLeft, FileText, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const TABS = ['캠퍼스 나침반', '동아리 홍보지', '기타 자료'];

export default function ResourcesPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

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
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-[#BDBDBD] mx-auto mb-3" />
          <p className="text-sm text-[#999]">등록된 자료가 없습니다</p>
          <p className="text-xs text-[#BDBDBD] mt-1">Admin에서 자료를 업로드해주세요</p>
        </div>
      </div>
    </div>
  );
}

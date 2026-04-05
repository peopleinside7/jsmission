'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ChevronLeft, Users, Calendar, MapPin, DollarSign, Lock } from 'lucide-react';
import Link from 'next/link';

interface ClubDetail {
  id: number; name: string; icon: string; icon_color: string; slogan: string;
  description?: string; category: string; target_age?: string; target_gender?: string;
  max_members?: number; schedule_text?: string; location?: string; fee_text?: string;
  instructor_info?: string; curriculum?: string; total_sessions?: number;
  recruitment_status: string; member_count: number; newcomer_count: number;
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [applyForm, setApplyForm] = useState({
    purpose: '', target_type: 'FRIEND', department: '', phone: ''
  });
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/clubs/${params.id}`).then(r => r.json()).then(d => {
      setClub(d.club);
      setIsMember(d.isMember || false);
    });
  }, [params.id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    const res = await fetch(`/api/clubs/${params.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applyForm),
    });
    if (res.ok) {
      setShowApply(false);
      alert('신청이 완료되었습니다!');
    } else {
      const data = await res.json();
      alert(data.error || '신청에 실패했습니다');
    }
    setApplyLoading(false);
  };

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" />
      </div>
    );
  }

  const curriculum = club.curriculum ? JSON.parse(club.curriculum) : [];

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-bold text-white flex-1">{club.name}</h1>
        {isMember && (
          <Link href={`/clubs/${club.id}/room`} className="text-white text-xs bg-white/20 px-3 py-1.5 rounded-full">
            <Lock className="w-3 h-3 inline mr-1" />운영방
          </Link>
        )}
      </div>

      <div className="px-4 pt-6 max-w-[640px] mx-auto">
        {/* Icon + Info */}
        <div className="text-center mb-6">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4"
            style={{ backgroundColor: club.icon_color }}
          >
            {club.icon}
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">{club.name}</h2>
          <p className="text-sm text-[#666] mt-1">{club.slogan}</p>
          <div className="flex justify-center gap-4 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full ${club.recruitment_status === 'OPEN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#999]'}`}>
              {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
            </span>
            <span className="text-xs text-[#999]">{club.category}</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {club.schedule_text && (
            <div className="bg-[#F7F7F7] rounded-xl p-4">
              <Calendar className="w-4 h-4 text-[#4CAF50] mb-1" />
              <p className="text-xs text-[#999]">일정</p>
              <p className="text-sm font-medium text-[#333]">{club.schedule_text}</p>
            </div>
          )}
          {club.location && (
            <div className="bg-[#F7F7F7] rounded-xl p-4">
              <MapPin className="w-4 h-4 text-[#4CAF50] mb-1" />
              <p className="text-xs text-[#999]">장소</p>
              <p className="text-sm font-medium text-[#333]">{club.location}</p>
            </div>
          )}
          {club.fee_text && (
            <div className="bg-[#F7F7F7] rounded-xl p-4">
              <DollarSign className="w-4 h-4 text-[#4CAF50] mb-1" />
              <p className="text-xs text-[#999]">회비</p>
              <p className="text-sm font-medium text-[#333]">{club.fee_text}</p>
            </div>
          )}
          <div className="bg-[#F7F7F7] rounded-xl p-4">
            <Users className="w-4 h-4 text-[#4CAF50] mb-1" />
            <p className="text-xs text-[#999]">멤버</p>
            <p className="text-sm font-medium text-[#333]">{club.member_count}명 {club.max_members ? `/ ${club.max_members}명` : ''}</p>
          </div>
        </div>

        {/* Target */}
        {(club.target_age || club.target_gender) && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">대상</h3>
            <p className="text-sm text-[#666]">
              {[club.target_age, club.target_gender].filter(Boolean).join(' / ')}
            </p>
          </div>
        )}

        {/* Instructor */}
        {club.instructor_info && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">강사 정보</h3>
            <p className="text-sm text-[#666]">{club.instructor_info}</p>
          </div>
        )}

        {/* Curriculum */}
        {curriculum.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">커리큘럼</h3>
            <div className="space-y-2">
              {curriculum.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-[#F7F7F7] p-3 rounded-xl">
                  <div className="w-7 h-7 bg-[#1E5631] text-white rounded-lg flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[#333]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        {club.recruitment_status === 'OPEN' && !isMember && (
          <button onClick={() => setShowApply(true)} className="btn-primary w-full mb-4">
            선교 참여 신청
          </button>
        )}
        {isMember && (
          <Link href={`/clubs/${club.id}/room`} className="btn-primary w-full block text-center mb-4">
            운영방 입장
          </Link>
        )}
      </div>

      {/* Apply Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowApply(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">선교 참여 신청</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">소속부서</label>
                <input className="input-field" placeholder="예: 청년부" value={applyForm.department} onChange={e => setApplyForm({ ...applyForm, department: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">연락처</label>
                <input className="input-field" placeholder="010-0000-0000" value={applyForm.phone} onChange={e => setApplyForm({ ...applyForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">목표 대상</label>
                <select
                  className="input-field"
                  value={applyForm.target_type}
                  onChange={e => setApplyForm({ ...applyForm, target_type: e.target.value })}
                >
                  <option value="FRIEND">친구</option>
                  <option value="COLLEAGUE">동료</option>
                  <option value="NEW_CONTACT">신규 지인</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#333] mb-1.5 block">참여 목적</label>
                <textarea className="input-field min-h-[80px]" placeholder="참여 목적을 작성해주세요" value={applyForm.purpose} onChange={e => setApplyForm({ ...applyForm, purpose: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowApply(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" disabled={applyLoading} className="btn-primary flex-1">
                  {applyLoading ? '신청 중...' : '신청하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

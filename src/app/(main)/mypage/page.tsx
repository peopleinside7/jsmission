'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Settings, Bell, ChevronRight } from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => setMyClubs(d.clubs || [])).catch(() => {});
    fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
  }, []);

  return (
    <div className="pb-24 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => router.back()}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <Link href="/mypage"><h1 className="text-base font-bold text-white flex-1">My</h1></Link>
        <Link href="/settings"><Settings className="w-5 h-5 text-white/80" /></Link>
        <Link href="/home"><Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" /></Link>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4">
        {/* 1. 나의 정보 */}
        <div className="bg-white rounded-2xl p-5 mb-4 border border-[#EEE]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center shrink-0">
              <Image src="/logo_r.png" alt="profile" width={44} height={44} className="rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-[#1A1A1A]">{user?.name}</p>
              <p className="text-xs text-[#999] mt-0.5">{user?.phone}</p>
              <p className="text-xs text-[#4CAF50] mt-0.5">
                {user?.role === 'ADMIN' ? '관리자' : user?.role === 'CLUB_ADMIN' ? '동아리 관리자' : '일반 회원'}
              </p>
            </div>
            <Link href="/settings" className="text-xs text-[#999] bg-[#F5F5F5] px-3 py-1.5 rounded-full">
              내 정보
            </Link>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Link href="/my-posts" className="bg-white rounded-2xl p-3 border border-[#EEE] text-center">
            <div className="text-xl mb-1">📝</div>
            <p className="text-[10px] font-medium text-[#333]">내 글</p>
          </Link>
          <Link href="/my-comments" className="bg-white rounded-2xl p-3 border border-[#EEE] text-center">
            <div className="text-xl mb-1">💬</div>
            <p className="text-[10px] font-medium text-[#333]">내 댓글</p>
          </Link>
          <Link href="/bookmarks" className="bg-white rounded-2xl p-3 border border-[#EEE] text-center">
            <div className="text-xl mb-1">⭐</div>
            <p className="text-[10px] font-medium text-[#333]">북마크</p>
          </Link>
          <Link href="/profile-edit" className="bg-white rounded-2xl p-3 border border-[#EEE] text-center">
            <div className="text-xl mb-1">⚙️</div>
            <p className="text-[10px] font-medium text-[#333]">프로필 수정</p>
          </Link>
        </div>

        {/* 2. 내가 가입한 동아리 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EEE]">
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
            🏠 내가 가입한 동아리
          </h3>
          {myClubs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-[#999]">가입한 동아리가 없습니다</p>
              <Link href="/clubs" className="inline-block mt-2 text-xs text-[#1E5631] font-medium">
                동아리 둘러보기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {myClubs.map((c: any) => (
                <Link key={c.id} href={`/clubs/${c.id}`} className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F5] last:border-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: c.icon_color }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#333] truncate">{c.name}</p>
                    <p className="text-[10px] text-[#999]">{c.schedule_text}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${c.recruitment_status === 'OPEN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#999]'}`}>
                    {c.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 3. 알림 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EEE]">
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1E5631]" /> 알림
          </h3>
          {notifications.length === 0 ? (
            <div className="space-y-0">
              {[
                { msg: '내가 작성한 글에 댓글이 작성되었습니다.', time: '방금 전' },
                { msg: '내가 가입한 동아리에 새글이 올라왔습니다.', time: '1시간 전' },
                { msg: '선교 참여 신청이 승인되었습니다.', time: '어제' },
                { msg: '오물오물 잉글리시 동아리 모임이 내일 예정되어 있습니다.', time: '어제' },
                { msg: '피드백에 관리자 답변이 등록되었습니다.', time: '2일 전' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-2.5 py-3 border-b border-[#F5F5F5] last:border-0">
                  <div className="w-2 h-2 bg-[#1E5631] rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-[#444] leading-relaxed">{n.msg}</p>
                    <p className="text-[10px] text-[#BDBDBD] mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((n: any) => (
                <div key={n.id} className="flex items-start gap-2.5 py-3 border-b border-[#F5F5F5] last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-[#BDBDBD]' : 'bg-[#1E5631]'}`} />
                  <div className="flex-1">
                    <p className="text-xs text-[#444] leading-relaxed">{n.message || n.title}</p>
                    <p className="text-[10px] text-[#BDBDBD] mt-0.5">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Trophy, Users, Target } from 'lucide-react';

interface Club {
  id: number; name: string; icon: string; icon_color: string; slogan: string;
  category: string; recruitment_status: string; member_count: number;
  schedule_text: string; target_age: string; newcomer_count: number;
}

const TABS = ['소개', '랭킹', '신청', '일정', '기도방'];
const CATEGORIES = ['전체', '교육', '스포츠', '문화', '대학사역', '찬양', '기타'];

export default function ClubsPage() {
  const [tab, setTab] = useState(0);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [category, setCategory] = useState('전체');
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => setClubs(d.clubs || [])).catch(() => {});
    fetch('/api/clubs/rankings').then(r => r.json()).then(d => setRankings(d.rankings || [])).catch(() => {});
  }, []);

  const filtered = category === '전체' ? clubs : clubs.filter(c => c.category === category);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-4 flex items-center gap-3">
        <h1 className="text-lg font-bold text-white flex-1">우리교회 선교동아리</h1>
        <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EEE] flex overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="page-container pt-4">
        {/* Tab 0: 소개 */}
        {tab === 0 && (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === c ? 'bg-[#1E5631] text-white' : 'bg-white text-[#666] border border-[#EEE]'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Club Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(club => (
                <Link key={club.id} href={`/clubs/${club.id}`} className="card p-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3"
                    style={{ backgroundColor: club.icon_color }}
                  >
                    {club.icon}
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{club.name}</p>
                  <p className="text-xs text-[#999] mt-0.5 truncate">{club.slogan}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${club.recruitment_status === 'OPEN' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-gray-100 text-[#999]'}`}>
                      {club.recruitment_status === 'OPEN' ? '모집중' : '마감'}
                    </span>
                    <span className="text-[10px] text-[#999]">
                      <Users className="w-3 h-3 inline mr-0.5" />{club.member_count || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Tab 1: 랭킹 */}
        {tab === 1 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">동아리 랭킹</h3>
            {rankings.length === 0 ? (
              <div className="text-center py-10 text-[#999] text-sm">아직 랭킹 데이터가 없습니다</div>
            ) : rankings.map((r: any, i: number) => (
              <div key={r.id} className="card p-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-[#1E5631] text-white' : 'bg-[#F5F5F5] text-[#999]'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.icon} {r.name}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-[#666]">멤버 {r.member_count || 0}</span>
                    <span className="text-xs text-[#666]">신입생 {r.newcomer_count || 0}</span>
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-[#FF9800]" />
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: 신청 */}
        {tab === 2 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">선교 참여 신청</h3>
            <p className="text-sm text-[#666] mb-4">동아리를 선택하면 신청서를 작성할 수 있습니다.</p>
            {clubs.filter(c => c.recruitment_status === 'OPEN').map(club => (
              <Link key={club.id} href={`/clubs/${club.id}`} className="card p-4 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: club.icon_color }}
                >
                  {club.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{club.name}</p>
                  <p className="text-xs text-[#999]">{club.schedule_text}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#BDBDBD]" />
              </Link>
            ))}
          </div>
        )}

        {/* Tab 3: 일정 */}
        {tab === 3 && (
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A] mb-3">이달의 동아리 일정</h3>
            {/* Calendar header */}
            <div className="card p-4 mb-4">
              <div className="text-center mb-3">
                <p className="text-sm font-bold">{new Date().getFullYear()}년 {new Date().getMonth() + 1}월</p>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['일','월','화','수','목','금','토'].map(d => (
                  <div key={d} className={`py-1 font-semibold ${d === '일' ? 'text-[#E53935]' : d === '토' ? 'text-[#1E88E5]' : 'text-[#666]'}`}>{d}</div>
                ))}
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dow = date.getDay();
                    const isToday = day === now.getDate();
                    const hasSat = dow === 6;
                    const hasSun = dow === 0;
                    const hasTueOrThu = dow === 2 || dow === 4;
                    const hasActivity = hasSat || hasSun || hasTueOrThu;
                    cells.push(
                      <div key={day} className={`py-1.5 rounded-lg relative ${isToday ? 'bg-[#1E5631] text-white font-bold' : dow === 0 ? 'text-[#E53935]' : dow === 6 ? 'text-[#1E88E5]' : 'text-[#333]'}`}>
                        {day}
                        {hasActivity && !isToday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1E5631] rounded-full" />}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
            {/* Schedule list */}
            <div className="space-y-2">
              {[
                { icon: '\uD83D\uDDE3\uFE0F', name: '오물오물 잉글리시', schedule: '매주 토요일 10:00', color: '#E8EAF6' },
                { icon: '\uD83C\uDF59', name: '일본어 오니기리', schedule: '격주 토요일 15:00', color: '#EFEBE9' },
                { icon: '\u26BD', name: 'POWER F.C', schedule: '매주 일요일 15:00~17:00', color: '#E3F2FD' },
                { icon: '\uD83C\uDFC3\u200D\u2640\uFE0F', name: '여자 플로우 러닝크루', schedule: '매주 화,목 19:30', color: '#E3F2FD' },
                { icon: '\uD83D\uDC83', name: '디어댄스', schedule: '매주 토요일 16:00~18:00', color: '#FCE4EC' },
                { icon: '\uD83E\uDDED', name: '캠퍼스 나침반', schedule: '상시', color: '#E8F5E9' },
                { icon: '\uD83C\uDFB5', name: 'JS 하모닉스', schedule: '매주 일요일', color: '#EDE7F6' },
              ].map(item => (
                <div key={item.name} className="card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: item.color }}>{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#333]">{item.name}</p>
                    <p className="text-xs text-[#999]">{item.schedule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: 기도방 */}
        {tab === 4 && <PrayerRoom />}
      </div>
    </div>
  );
}

function PrayerRoom() {
  const [newcomers, setNewcomers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/newcomers/dashboard?withList=true')
      .then(r => r.json())
      .then(d => setNewcomers(d.newcomers || []))
      .catch(() => {});
  }, []);

  const handlePray = async (id: number) => {
    await fetch(`/api/newcomers/${id}/pray`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '기도합니다' }),
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-[#1A1A1A]">신입생 기도방</h3>
      {newcomers.length === 0 ? (
        <div className="text-center py-10 text-[#999] text-sm">아직 등록된 신입생이 없습니다</div>
      ) : newcomers.map((n: any) => (
        <div key={n.id} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">{n.name}</p>
              <p className="text-xs text-[#999]">{n.club_name}</p>
            </div>
            <button
              onClick={() => handlePray(n.id)}
              className="px-3 py-1.5 bg-[#E8F5E9] text-[#1E5631] rounded-full text-xs font-medium"
            >
              🙏 기도
            </button>
          </div>
          {n.prayer_request && (
            <p className="text-xs text-[#666] bg-[#F7F7F7] p-3 rounded-lg">{n.prayer_request}</p>
          )}
        </div>
      ))}
    </div>
  );
}

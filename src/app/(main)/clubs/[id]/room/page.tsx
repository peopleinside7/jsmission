'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ChevronLeft, Send, Pin, Users, Calendar, FileText, MessageCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';

const ROOM_TABS = [
  { icon: Calendar, label: '일정' },
  { icon: FileText, label: '공지' },
  { icon: MessageCircle, label: '대화방' },
  { icon: FileText, label: '자료방' },
  { icon: UserPlus, label: '신입생' },
];

export default function ClubRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState(2); // Default to chat
  const [club, setClub] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [newcomers, setNewcomers] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const clubId = params.id;

  useEffect(() => {
    fetch(`/api/clubs/${clubId}`).then(r => r.json()).then(d => {
      setClub(d.club);
      if (!d.isMember) router.replace('/clubs');
    });
    fetch(`/api/clubs/${clubId}/members`).then(r => r.json()).then(d => setMembers(d.members || []));
    fetch(`/api/clubs/${clubId}/newcomers`).then(r => r.json()).then(d => setNewcomers(d.newcomers || []));
  }, [clubId]);

  // Chat polling
  useEffect(() => {
    if (tab !== 2) return;
    const fetchChat = () => {
      fetch(`/api/clubs/${clubId}/chat`).then(r => r.json()).then(d => setMessages(d.messages || []));
    };
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [tab, clubId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    await fetch(`/api/clubs/${clubId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMsg }),
    });
    setNewMsg('');
  };

  if (!club) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#E8F5E9] border-t-[#1E5631] rounded-full animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">{club.icon} {club.name}</h1>
          <p className="text-xs text-white/70">운영방</p>
        </div>
        <div className="flex items-center text-white/70 text-xs">
          <Users className="w-4 h-4 mr-1" />{members.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EEE] flex shrink-0">
        {ROOM_TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTab(i)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${tab === i ? 'text-[#1E5631] border-[#1E5631]' : 'text-[#999] border-transparent'}`}
          >
            <t.icon className="w-4 h-4" />
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab 0: 일정 */}
        {tab === 0 && (
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold">회차 일정</h3>
            <div className="text-center py-8 text-[#999] text-sm">
              일정이 등록되면 여기에 표시됩니다
            </div>
          </div>
        )}

        {/* Tab 1: 공지 */}
        {tab === 1 && (
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold">동아리 공지</h3>
            <div className="text-center py-8 text-[#999] text-sm">
              등록된 공지가 없습니다
            </div>
          </div>
        )}

        {/* Tab 2: 대화방 */}
        {tab === 2 && (
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-sm">
                첫 메시지를 보내보세요!
              </div>
            ) : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.user_id === user?.userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${msg.user_id === user?.userId ? 'order-1' : ''}`}>
                  {msg.user_id !== user?.userId && (
                    <p className="text-xs text-[#999] mb-1">{msg.user_name}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.user_id === user?.userId ? 'bg-[#1E5631] text-white rounded-tr-md' : 'bg-[#F7F7F7] text-[#333] rounded-tl-md'}`}>
                    {msg.content}
                    {msg.is_pinned && <Pin className="w-3 h-3 inline ml-1 opacity-60" />}
                  </div>
                  <p className="text-[10px] text-[#BDBDBD] mt-0.5">{new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Tab 3: 자료방 */}
        {tab === 3 && (
          <div className="p-4">
            <h3 className="text-sm font-bold mb-3">자료방</h3>
            <div className="text-center py-8 text-[#999] text-sm">
              등록된 자료가 없습니다
            </div>
          </div>
        )}

        {/* Tab 4: 신입생 */}
        {tab === 4 && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">신입생 현황</h3>
              <span className="text-xs text-[#999]">{newcomers.length}명</span>
            </div>
            {newcomers.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-sm">아직 등록된 신입생이 없습니다</div>
            ) : newcomers.map((n: any) => (
              <Link key={n.id} href={`/newcomers/${n.id}`} className="card p-4 flex items-center gap-3 block">
                <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-sm font-bold text-[#1E5631]">
                  {n.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.name}</p>
                  <p className="text-xs text-[#999]">{n.how_met} / {n.age_group}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === 'GOSPEL' ? 'bg-red-50 text-[#E53935]' : n.status === 'COMPLETE' ? 'bg-[#E8F5E9] text-[#1E5631]' : 'bg-orange-50 text-[#FF9800]'}`}>
                  {({ ATTEMPT: '시도', PRELIM: '전초', GOSPEL: '말씀연결', WORSHIP: '예배참석', COMPLETE: '수료', LOST: '이탈' } as any)[n.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input (only in chat tab) */}
      {tab === 2 && (
        <div className="p-3 bg-white border-t border-[#EEE] shrink-0 flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="메시지를 입력하세요"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="w-10 h-10 bg-[#1E5631] rounded-xl flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

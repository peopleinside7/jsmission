'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Search, X, Clock } from 'lucide-react';

const BOARD_LABELS: Record<string, string> = {
  NOTICE: '공지사항',
  SERMON: '생명의 말씀',
  FREE: '자유게시판',
  RESOURCE: '자료실',
  FEEDBACK: 'Feedback',
};

type Post = {
  id: number;
  title: string;
  content: string;
  board_type: string;
  resource_category?: string | null;
  created_at: string;
  author_name?: string;
};

const RECENT_KEY = 'jsmission:recent-searches';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, 5);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { cache: 'no-store' });
      const data = await res.json();
      setResults(data.posts || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) runSearch(query);
      else { setResults([]); setSearched(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecent(query);
    runSearch(query);
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch { return s; }
  };

  const snippet = (content: string) => {
    if (!content) return '';
    const plain = content.replace(/\s+/g, ' ').trim();
    return plain.length > 80 ? plain.slice(0, 80) + '...' : plain;
  };

  return (
    <div className="pb-24 bg-[#F5F5F5] min-h-screen">
      <div className="bg-[#1E5631] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => router.back()} aria-label="뒤로가기"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h1 className="text-base font-bold text-white flex-1">검색</h1>
        <Link href="/home">
          <Image src="/logo_header.jpg" alt="JS MISSION" width={90} height={22} className="h-[20px] w-auto shrink-0" />
        </Link>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4">
        <form onSubmit={handleSubmit} className="relative mb-4">
          <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full bg-white border border-[#E5E5E5] rounded-full pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#1E5631]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="지우기"
            >
              <X className="w-4 h-4 text-[#999]" />
            </button>
          )}
        </form>

        {loading && (
          <div className="text-center py-10 text-sm text-[#999]">검색 중...</div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-[#999]">검색 결과가 없습니다</p>
          </div>
        )}

        {!loading && !searched && recent.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-[#EEE]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A]">최근 검색어</h3>
              <button onClick={clearRecent} className="text-xs text-[#999]">전체 삭제</button>
            </div>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => { setQuery(r); runSearch(r); }}
                    className="w-full flex items-center gap-2 text-left text-sm text-[#333] py-1.5"
                  >
                    <Clock className="w-4 h-4 text-[#999]" />
                    <span className="flex-1 truncate">{r}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul className="space-y-2">
            {results.map((p) => (
              <li key={`${p.board_type}-${p.id}`}>
                <Link
                  href={`/boards/${p.board_type}/${p.id}`}
                  onClick={() => saveRecent(query)}
                  className="block bg-white rounded-2xl p-4 border border-[#EEE] hover:bg-[#FAFAFA]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block text-[10px] font-bold bg-[#E8F5E9] text-[#1E5631] px-2 py-0.5 rounded-full">
                      {BOARD_LABELS[p.board_type] || p.board_type}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                  <p className="text-xs text-[#666] mt-1 line-clamp-2">{snippet(p.content)}</p>
                  <p className="text-[11px] text-[#999] mt-2">
                    {p.author_name || '익명'} · {formatDate(p.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// POST: 일괄 삭제
// PUT: 핀 고정 토글
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = JSON.parse(await request.text());
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: '대상 게시글이 없습니다' }, { status: 400 });
    }

    const db = await initDbAsync();
    const placeholders = ids.map(() => '?').join(',');

    if (action === 'delete') {
      // 댓글 + 좋아요 정리 후 글 삭제
      db.prepare(`DELETE FROM comments WHERE post_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM likes WHERE target_type = 'POST' AND target_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM posts WHERE id IN (${placeholders})`).run(...ids);
      return Response.json({ message: `${ids.length}개 글 삭제 완료` });
    }

    return Response.json({ error: '올바르지 않은 액션입니다' }, { status: 400 });
  } catch (error: any) {
    console.error('Bulk action error:', error);
    return Response.json({ error: '처리 중 오류가 발생했습니다', detail: error?.message }, { status: 500 });
  }
}

// 핀 고정 토글
export async function PUT(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = JSON.parse(await request.text());
    const { id, pinned } = body;

    if (!id) return Response.json({ error: '게시글 ID가 필요합니다' }, { status: 400 });

    const db = await initDbAsync();

    // is_pinned 컬럼 동적 추가 (없는 경우)
    try {
      db.exec('ALTER TABLE posts ADD COLUMN is_pinned INTEGER DEFAULT 0');
    } catch { /* 이미 존재 */ }

    db.prepare('UPDATE posts SET is_pinned = ? WHERE id = ?').run(pinned ? 1 : 0, id);
    return Response.json({ message: pinned ? '고정되었습니다' : '고정 해제되었습니다' });
  } catch (error: any) {
    console.error('Pin error:', error);
    return Response.json({ error: '핀 고정 처리 중 오류가 발생했습니다', detail: error?.message }, { status: 500 });
  }
}

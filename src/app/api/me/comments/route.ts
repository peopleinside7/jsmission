import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const db = await initDbAsync();
    const comments = db.prepare(`
      SELECT c.id, c.content, c.created_at, c.post_id, c.parent_id,
        p.title as post_title, p.board_type
      FROM comments c JOIN posts p ON p.id = c.post_id
      WHERE c.author_id = ? ORDER BY c.created_at DESC LIMIT 100
    `).all(user.userId);
    return Response.json({ comments });
  } catch (error: any) {
    return Response.json({ error: '조회 실패', detail: error?.message }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const db = await initDbAsync();
    const posts = db.prepare(`
      SELECT p.*, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id) as like_count
      FROM posts p JOIN users u ON u.id = p.author_id
      WHERE p.author_id = ? ORDER BY p.created_at DESC LIMIT 100
    `).all(user.userId);
    return Response.json({ posts });
  } catch (error: any) {
    return Response.json({ error: '조회 실패', detail: error?.message }, { status: 500 });
  }
}

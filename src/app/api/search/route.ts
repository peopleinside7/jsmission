import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    if (!q) return Response.json({ posts: [] });

    const db = await initDbAsync();
    const pattern = `%${q}%`;

    let posts;
    if (user.role === 'ADMIN') {
      posts = db.prepare(`
        SELECT p.id, p.title, p.content, p.board_type, p.resource_category, p.created_at, u.name as author_name
        FROM posts p JOIN users u ON u.id = p.author_id
        WHERE p.title LIKE ? OR p.content LIKE ?
        ORDER BY p.created_at DESC LIMIT 50
      `).all(pattern, pattern);
    } else {
      posts = db.prepare(`
        SELECT p.id, p.title, p.content, p.board_type, p.resource_category, p.created_at, u.name as author_name
        FROM posts p JOIN users u ON u.id = p.author_id
        WHERE (p.title LIKE ? OR p.content LIKE ?)
          AND (p.board_type != 'FEEDBACK' OR p.author_id = ?)
        ORDER BY p.created_at DESC LIMIT 50
      `).all(pattern, pattern, user.userId);
    }

    return Response.json({ posts, query: q });
  } catch (error: any) {
    return Response.json({ error: '검색 실패', detail: error?.message }, { status: 500 });
  }
}

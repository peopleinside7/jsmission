import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync, ensureUserExists } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const db = await initDbAsync();
    try { db.exec('CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, post_id))'); } catch {}
    const bookmarks = db.prepare(`
      SELECT b.id as bookmark_id, b.created_at as bookmarked_at,
        p.id, p.title, p.content, p.board_type, p.resource_category, p.created_at,
        u.name as author_name
      FROM bookmarks b
      JOIN posts p ON p.id = b.post_id
      JOIN users u ON u.id = p.author_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(user.userId);
    return Response.json({ bookmarks });
  } catch (error: any) {
    return Response.json({ error: '조회 실패', detail: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const { post_id } = JSON.parse(await request.text());
    if (!post_id) return Response.json({ error: 'post_id가 필요합니다' }, { status: 400 });

    const db = await initDbAsync();
    await ensureUserExists(db, user);
    try { db.exec('CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, post_id))'); } catch {}

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(user.userId, post_id);
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').run(user.userId, post_id);
      return Response.json({ bookmarked: false });
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(user.userId, post_id);
      return Response.json({ bookmarked: true });
    }
  } catch (error: any) {
    return Response.json({ error: '북마크 처리 실패', detail: error?.message }, { status: 500 });
  }
}

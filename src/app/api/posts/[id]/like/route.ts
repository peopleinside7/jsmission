import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const existing = db.prepare(
      "SELECT id FROM likes WHERE user_id = ? AND target_type = 'POST' AND target_id = ?"
    ).get(user.userId, id);

    if (existing) {
      // Unlike
      db.prepare(
        "DELETE FROM likes WHERE user_id = ? AND target_type = 'POST' AND target_id = ?"
      ).run(user.userId, id);

      const count = db.prepare(
        "SELECT COUNT(*) as count FROM likes WHERE target_type = 'POST' AND target_id = ?"
      ).get(id) as any;

      return Response.json({ liked: false, like_count: count.count });
    } else {
      // Like
      db.prepare(
        "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'POST', ?)"
      ).run(user.userId, id);

      const count = db.prepare(
        "SELECT COUNT(*) as count FROM likes WHERE target_type = 'POST' AND target_id = ?"
      ).get(id) as any;

      return Response.json({ liked: true, like_count: count.count });
    }
  } catch (error) {
    console.error('Like toggle error:', error);
    return Response.json({ error: '좋아요 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

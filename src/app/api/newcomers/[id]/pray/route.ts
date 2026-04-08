import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync, ensureUserExists } from '@/lib/db';

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
    const { content } = JSON.parse(await request.text());

    const db = await initDbAsync();
    await ensureUserExists(db, user);

    const result = db.prepare(
      'INSERT INTO prayers (newcomer_id, user_id, content) VALUES (?, ?, ?)'
    ).run(id, user.userId, content || null);

    const prayer = db.prepare(`
      SELECT p.*, u.name as user_name
      FROM prayers p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ prayer }, { status: 201 });
  } catch (error) {
    console.error('Prayer create error:', error);
    return Response.json({ error: '기도 등록 중 오류가 발생했습니다' }, { status: 500 });
  }
}

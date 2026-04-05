import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

function checkNewcomerAccess(db: any, newcomerId: string, userId: number, userRole: string): boolean {
  if (userRole === 'ADMIN') return true;
  const newcomer = db.prepare('SELECT club_id FROM newcomers WHERE id = ?').get(newcomerId);
  if (!newcomer) return false;
  const member = db.prepare(
    'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
  ).get(newcomer.club_id, userId);
  return !!member;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const db = await initDbAsync();

    if (!checkNewcomerAccess(db, id, user.userId, user.role)) {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const logs = db.prepare(`
      SELECT al.*, u.name as author_name
      FROM activity_logs al
      JOIN users u ON u.id = al.author_id
      WHERE al.newcomer_id = ?
      ORDER BY al.created_at DESC
    `).all(id);

    return Response.json({ logs });
  } catch (error) {
    console.error('Logs list error:', error);
    return Response.json({ error: '활동 로그 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

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
    const { content, activity_type } = await request.json();

    if (!content || !activity_type) {
      return Response.json({ error: '내용과 활동 유형은 필수입니다' }, { status: 400 });
    }

    const validTypes = ['ATTEMPT', 'PRELIM', 'GOSPEL', 'WORSHIP', 'COMPLETE'];
    if (!validTypes.includes(activity_type)) {
      return Response.json({ error: '올바르지 않은 활동 유형입니다' }, { status: 400 });
    }

    const db = await initDbAsync();

    if (!checkNewcomerAccess(db, id, user.userId, user.role)) {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const result = db.prepare(
      'INSERT INTO activity_logs (newcomer_id, author_id, content, activity_type) VALUES (?, ?, ?, ?)'
    ).run(id, user.userId, content, activity_type);

    db.prepare(
      "UPDATE newcomers SET last_contact_date = date('now'), status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(activity_type, id);

    const log = db.prepare(`
      SELECT al.*, u.name as author_name
      FROM activity_logs al
      JOIN users u ON u.id = al.author_id
      WHERE al.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Log create error:', error);
    return Response.json({ error: '활동 로그 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

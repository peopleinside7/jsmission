import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

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

    const sessions = db.prepare(`
      SELECT cs.*,
        (SELECT COUNT(*) FROM session_attendees sa WHERE sa.session_id = cs.id AND sa.status = 'ATTEND') as attend_count,
        (SELECT COUNT(*) FROM session_attendees sa WHERE sa.session_id = cs.id) as total_attendees
      FROM club_sessions cs
      WHERE cs.club_id = ?
      ORDER BY cs.session_no ASC
    `).all(id);

    return Response.json({ sessions });
  } catch (error) {
    console.error('Sessions list error:', error);
    return Response.json({ error: '세션 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
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
    const db = await initDbAsync();

    // Check permission
    if (user.role !== 'ADMIN') {
      const membership = db.prepare(
        'SELECT role FROM club_members WHERE club_id = ? AND user_id = ?'
      ).get(id, user.userId) as any;
      if (!membership || membership.role !== 'ADMIN') {
        return Response.json({ error: '권한이 없습니다' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { sessions } = body;

    if (sessions && Array.isArray(sessions)) {
      // Bulk generate sessions
      const insert = db.prepare(`
        INSERT INTO club_sessions (club_id, session_no, topic, session_date, start_time, end_time, location, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((items: any[]) => {
        for (const s of items) {
          insert.run(
            id, s.session_no, s.topic || null, s.session_date || null,
            s.start_time || null, s.end_time || null, s.location || null, s.notes || null
          );
        }
      });

      insertMany(sessions);

      return Response.json({ message: `${sessions.length}개 세션이 생성되었습니다` }, { status: 201 });
    }

    // Single session
    const { session_no, topic, session_date, start_time, end_time, location, notes } = body;

    const result = db.prepare(`
      INSERT INTO club_sessions (club_id, session_no, topic, session_date, start_time, end_time, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session_no, topic || null, session_date || null, start_time || null, end_time || null, location || null, notes || null);

    const session = db.prepare('SELECT * FROM club_sessions WHERE id = ?').get(result.lastInsertRowid);

    return Response.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Session create error:', error);
    return Response.json({ error: '세션 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

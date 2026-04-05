import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

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
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const db = getDb();

    let query = `
      SELECT n.*,
        u1.name as registered_by_name,
        u2.name as assigned_to_name,
        c.name as club_name, c.icon as club_icon
      FROM newcomers n
      LEFT JOIN users u1 ON u1.id = n.registered_by
      LEFT JOIN users u2 ON u2.id = n.assigned_to
      LEFT JOIN clubs c ON c.id = n.club_id
      WHERE n.club_id = ?
    `;
    const queryParams: any[] = [id];

    if (status) {
      query += ' AND n.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY n.created_at DESC';

    const newcomers = db.prepare(query).all(...queryParams);

    return Response.json({ newcomers });
  } catch (error) {
    console.error('Newcomers list error:', error);
    return Response.json({ error: '새신자 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
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
    const body = await request.json();
    const {
      name, phone, age_group, gender, introduction,
      how_met, status, prayer_request, assigned_to, notes,
    } = body;

    if (!name) {
      return Response.json({ error: '이름은 필수입니다' }, { status: 400 });
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO newcomers (club_id, registered_by, assigned_to, name, phone, age_group, gender,
        introduction, how_met, status, prayer_request, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.userId, assigned_to || null, name, phone || null,
      age_group || null, gender || null, introduction || null,
      how_met || null, status || 'ATTEMPT', prayer_request || null, notes || null
    );

    const newcomer = db.prepare('SELECT * FROM newcomers WHERE id = ?').get(result.lastInsertRowid);

    return Response.json({ newcomer }, { status: 201 });
  } catch (error) {
    console.error('Newcomer create error:', error);
    return Response.json({ error: '새신자 등록 중 오류가 발생했습니다' }, { status: 500 });
  }
}

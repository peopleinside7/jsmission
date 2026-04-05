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
    const db = getDb();

    const newcomer = db.prepare(`
      SELECT n.*,
        u1.name as registered_by_name,
        u2.name as assigned_to_name,
        c.name as club_name, c.icon as club_icon
      FROM newcomers n
      LEFT JOIN users u1 ON u1.id = n.registered_by
      LEFT JOIN users u2 ON u2.id = n.assigned_to
      LEFT JOIN clubs c ON c.id = n.club_id
      WHERE n.id = ?
    `).get(id);

    if (!newcomer) {
      return Response.json({ error: '새신자를 찾을 수 없습니다' }, { status: 404 });
    }

    return Response.json({ newcomer });
  } catch (error) {
    console.error('Newcomer detail error:', error);
    return Response.json({ error: '새신자 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PUT(
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
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'phone', 'age_group', 'gender', 'introduction',
      'how_met', 'status', 'prayer_request', 'assigned_to',
      'last_contact_date', 'notes',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: '수정할 데이터가 없습니다' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE newcomers SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const newcomer = db.prepare('SELECT * FROM newcomers WHERE id = ?').get(id);
    return Response.json({ newcomer });
  } catch (error) {
    console.error('Newcomer update error:', error);
    return Response.json({ error: '새신자 정보 수정 중 오류가 발생했습니다' }, { status: 500 });
  }
}

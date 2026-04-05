import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const clubs = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members WHERE club_id = c.id) as member_count,
        (SELECT COUNT(*) FROM newcomers WHERE club_id = c.id) as newcomer_count
      FROM clubs c
      WHERE c.is_active = 1
      ORDER BY c.display_order ASC, c.created_at DESC
    `).all();

    return Response.json({ clubs });
  } catch (error) {
    console.error('Clubs list error:', error);
    return Response.json({ error: '클럽 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, icon, icon_color, slogan, description, category,
      poster_image, target_age, target_gender, max_members,
      schedule_text, location, fee_text, instructor_info,
      curriculum, total_sessions, external_link,
      recruitment_status, approval_mode, display_order,
    } = body;

    if (!name) {
      return Response.json({ error: '클럽 이름은 필수입니다' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO clubs (name, icon, icon_color, slogan, description, category,
        poster_image, target_age, target_gender, max_members,
        schedule_text, location, fee_text, instructor_info,
        curriculum, total_sessions, external_link,
        recruitment_status, approval_mode, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, icon || null, icon_color || null, slogan || null, description || null,
      category || '기타', poster_image || null, target_age || null,
      target_gender || null, max_members || null, schedule_text || null,
      location || null, fee_text || null, instructor_info || null,
      curriculum ? JSON.stringify(curriculum) : null, total_sessions || null,
      external_link || null, recruitment_status || 'OPEN',
      approval_mode || 'CLUB_ADMIN', display_order || 0
    );

    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(result.lastInsertRowid);

    return Response.json({ club }, { status: 201 });
  } catch (error) {
    console.error('Club create error:', error);
    return Response.json({ error: '클럽 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

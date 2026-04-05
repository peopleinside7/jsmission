import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await initDbAsync();
    const user = getTokenFromRequest(request as NextRequest);

    const club = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members WHERE club_id = c.id) as member_count,
        (SELECT COUNT(*) FROM newcomers WHERE club_id = c.id) as newcomer_count
      FROM clubs c WHERE c.id = ?
    `).get(id);

    if (!club) {
      return Response.json({ error: '클럽을 찾을 수 없습니다' }, { status: 404 });
    }

    let isMember = false;
    if (user) {
      if (user.role === 'ADMIN') {
        isMember = true;
      } else {
        const membership = db.prepare(
          'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
        ).get(id, user.userId);
        isMember = !!membership;
      }
    }

    return Response.json({ club, isMember });
  } catch (error) {
    console.error('Club detail error:', error);
    return Response.json({ error: '클럽 조회 중 오류가 발생했습니다' }, { status: 500 });
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
    const db = await initDbAsync();

    // Check permission: ADMIN or club ADMIN
    if (user.role !== 'ADMIN') {
      const membership = db.prepare(
        'SELECT role FROM club_members WHERE club_id = ? AND user_id = ?'
      ).get(id, user.userId) as any;
      if (!membership || membership.role !== 'ADMIN') {
        return Response.json({ error: '권한이 없습니다' }, { status: 403 });
      }
    }

    const body = await request.json();
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'icon', 'icon_color', 'slogan', 'description', 'category',
      'poster_image', 'target_age', 'target_gender', 'max_members',
      'schedule_text', 'location', 'fee_text', 'instructor_info',
      'curriculum', 'total_sessions', 'external_link',
      'recruitment_status', 'approval_mode', 'display_order', 'is_active',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'curriculum' ? JSON.stringify(body[field]) : body[field]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: '수정할 데이터가 없습니다' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE clubs SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(id);
    return Response.json({ club });
  } catch (error) {
    console.error('Club update error:', error);
    return Response.json({ error: '클럽 수정 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const { id } = await params;
    const db = await initDbAsync();

    db.prepare('UPDATE clubs SET is_active = 0 WHERE id = ?').run(id);

    return Response.json({ message: '클럽이 삭제되었습니다' });
  } catch (error) {
    console.error('Club delete error:', error);
    return Response.json({ error: '클럽 삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

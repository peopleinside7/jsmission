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

    const members = db.prepare(`
      SELECT cm.id, cm.club_id, cm.user_id, cm.role, cm.joined_at,
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        u.department as user_department, u.profile_image
      FROM club_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = ?
      ORDER BY cm.role DESC, cm.joined_at ASC
    `).all(id);

    return Response.json({ members });
  } catch (error) {
    console.error('Members list error:', error);
    return Response.json({ error: '멤버 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

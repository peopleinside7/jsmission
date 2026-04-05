import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = await initDbAsync();

    if (body.action === 'approve') {
      db.prepare(
        'UPDATE users SET is_approved = 1, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(user.userId, id);
      return Response.json({ message: '회원이 승인되었습니다' });
    }

    if (body.action === 'reject') {
      db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
      return Response.json({ message: '회원이 거절되었습니다' });
    }

    if (body.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(body.role, id);
      return Response.json({ message: '역할이 변경되었습니다' });
    }

    return Response.json({ error: '올바른 요청이 아닙니다' }, { status: 400 });
  } catch (error) {
    console.error('Admin user update error:', error);
    return Response.json({ error: '회원 관리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

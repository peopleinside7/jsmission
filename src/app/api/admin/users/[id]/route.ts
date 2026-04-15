import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

const VALID_ROLES = ['USER', 'CLUB_ADMIN', 'PASTOR', 'ADMIN'];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const { id } = await params;
    const targetId = parseInt(id);
    if (isNaN(targetId) || targetId <= 0) {
      return Response.json({ error: '올바르지 않은 사용자 ID입니다' }, { status: 400 });
    }

    const body = JSON.parse(await request.text());
    const db = await initDbAsync();

    // Check target user exists
    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId);
    if (!target) {
      return Response.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // Prevent self-deactivation
    if (targetId === user.userId && (body.action === 'reject' || body.role === 'USER')) {
      return Response.json({ error: '자기 자신의 권한은 변경할 수 없습니다' }, { status: 400 });
    }

    if (body.action === 'approve') {
      db.prepare(
        'UPDATE users SET is_approved = 1, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(user.userId, targetId);
      return Response.json({ message: '회원이 승인되었습니다' });
    }

    if (body.action === 'reject') {
      db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(targetId);
      return Response.json({ message: '회원이 거절되었습니다' });
    }

    if (body.role) {
      if (!VALID_ROLES.includes(body.role)) {
        return Response.json({ error: '올바르지 않은 역할입니다' }, { status: 400 });
      }
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(body.role, targetId);
      return Response.json({ message: '역할이 변경되었습니다' });
    }

    // 회원 정보 수정: 이름/연락처/부서 (어느 하나라도 있으면 처리)
    if (body.name !== undefined || body.phone !== undefined || body.department !== undefined) {
      const fields: string[] = [];
      const values: any[] = [];
      if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name?.trim() || null); }
      if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone?.trim() || null); }
      if (body.department !== undefined) { fields.push('department = ?'); values.push(body.department?.trim() || null); }
      values.push(targetId);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      const updated = db.prepare('SELECT id, name, phone, department, role FROM users WHERE id = ?').get(targetId);
      return Response.json({ message: '회원 정보가 수정되었습니다', user: updated });
    }

    return Response.json({ error: '올바른 요청이 아닙니다' }, { status: 400 });
  } catch (error) {
    console.error('Admin user update error:', error);
    return Response.json({ error: '회원 관리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

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
    const { status } = JSON.parse(await request.text());

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return Response.json({ error: '유효하지 않은 상태입니다' }, { status: 400 });
    }

    const db = await initDbAsync();

    const application = db.prepare(`
      SELECT ca.*, c.name as club_name
      FROM club_applications ca
      JOIN clubs c ON c.id = ca.club_id
      WHERE ca.id = ?
    `).get(id) as any;

    if (!application) {
      return Response.json({ error: '신청을 찾을 수 없습니다' }, { status: 404 });
    }

    // Check permission: system ADMIN or club ADMIN
    if (user.role !== 'ADMIN') {
      const membership = db.prepare(
        "SELECT role FROM club_members WHERE club_id = ? AND user_id = ? AND role = 'ADMIN'"
      ).get(application.club_id, user.userId) as any;
      if (!membership) {
        return Response.json({ error: '권한이 없습니다' }, { status: 403 });
      }
    }

    db.prepare(
      "UPDATE club_applications SET status = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?"
    ).run(status, user.userId, id);

    // On approve, add to club_members
    if (status === 'APPROVED') {
      const existingMember = db.prepare(
        'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
      ).get(application.club_id, application.user_id);

      if (!existingMember) {
        db.prepare(
          'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)'
        ).run(application.club_id, application.user_id);
      }

      // Send notification
      db.prepare(
        "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, 'APPLICATION_APPROVED', ?, ?, ?)"
      ).run(
        application.user_id,
        '클럽 가입 승인',
        `${application.club_name} 클럽 가입이 승인되었습니다`,
        `/clubs/${application.club_id}`
      );
    } else {
      // Rejected notification
      db.prepare(
        "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'APPLICATION_REJECTED', ?, ?)"
      ).run(
        application.user_id,
        '클럽 가입 거절',
        `${application.club_name} 클럽 가입이 거절되었습니다`
      );
    }

    const updated = db.prepare('SELECT * FROM club_applications WHERE id = ?').get(id);

    return Response.json({ application: updated });
  } catch (error) {
    console.error('Application review error:', error);
    return Response.json({ error: '신청 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const db = getDb();

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(user.userId);

    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(user.userId) as any;

    return Response.json({ notifications, unreadCount: unreadCount.count });
  } catch (error) {
    console.error('Notifications error:', error);
    return Response.json({ error: '알림 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    const db = getDb();

    if (id) {
      // Mark single notification as read
      db.prepare(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
      ).run(id, user.userId);
    } else {
      // Mark all as read
      db.prepare(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
      ).run(user.userId);
    }

    return Response.json({ message: '알림이 읽음 처리되었습니다' });
  } catch (error) {
    console.error('Notification read error:', error);
    return Response.json({ error: '알림 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

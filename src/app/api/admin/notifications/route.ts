import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// GET: 발송된 알림 목록 (최근 100건)
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await initDbAsync();

    // 알림 발송 내역 (브로드캐스트 = type='BROADCAST')
    const notifs = db.prepare(`
      SELECT type, title, message, link, created_at,
        COUNT(*) as recipient_count
      FROM notifications
      WHERE type = 'BROADCAST'
      GROUP BY title, message, created_at
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND is_approved = 1').get() as any;

    return Response.json({ notifications: notifs, totalUsers: totalUsers.count });
  } catch (error: any) {
    console.error('Notifications list error:', error);
    return Response.json({ error: '알림 목록 조회 중 오류', detail: error?.message }, { status: 500 });
  }
}

// POST: 전체 사용자에게 알림 발송
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = JSON.parse(await request.text());
    const { title, message, link, target } = body;

    if (!title) return Response.json({ error: '제목은 필수입니다' }, { status: 400 });

    const db = await initDbAsync();

    // 대상 사용자 결정
    let targetUsers: any[] = [];
    if (target === 'all' || !target) {
      targetUsers = db.prepare('SELECT id FROM users WHERE is_active = 1 AND is_approved = 1').all();
    } else {
      // role 기반 필터
      targetUsers = db.prepare('SELECT id FROM users WHERE is_active = 1 AND is_approved = 1 AND role = ?').all(target);
    }

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'BROADCAST', ?, ?, ?)
    `);

    for (const u of targetUsers) {
      insertNotif.run(u.id, title, message || null, link || null);
    }

    return Response.json({
      message: `${targetUsers.length}명에게 알림을 발송했습니다`,
      count: targetUsers.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Send notification error:', error);
    return Response.json({ error: '알림 발송 중 오류', detail: error?.message }, { status: 500 });
  }
}

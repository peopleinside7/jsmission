import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const db = await initDbAsync();

    const streetCount = db.prepare(
      "SELECT COUNT(*) as count FROM mission_logs WHERE log_type = 'STREET'"
    ).get() as any;

    const promotionCount = db.prepare(
      "SELECT COUNT(*) as count FROM mission_logs WHERE log_type = 'PROMOTION'"
    ).get() as any;

    const totalAttempts = db.prepare(
      'SELECT COALESCE(SUM(attempt_count), 0) as total FROM mission_logs'
    ).get() as any;

    const recentLogs = db.prepare(`
      SELECT ml.*, u.name as user_name
      FROM mission_logs ml
      JOIN users u ON u.id = ml.user_id
      ORDER BY ml.created_at DESC
      LIMIT 10
    `).all();

    const upcomingAppointments = db.prepare(`
      SELECT ma.*, u.name as creator_name
      FROM mission_appointments ma
      JOIN users u ON u.id = ma.created_by
      WHERE ma.appointment_date >= date('now')
      ORDER BY ma.appointment_date ASC, ma.start_time ASC
      LIMIT 5
    `).all();

    return Response.json({
      stats: {
        streetCount: streetCount.count,
        promotionCount: promotionCount.count,
        totalAttempts: totalAttempts.total,
      },
      recentLogs,
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Mission dashboard error:', error);
    return Response.json({ error: '전도 대시보드 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

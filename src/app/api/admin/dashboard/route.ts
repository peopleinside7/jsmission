import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = getDb();

    const userCount = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    ).get() as any;

    const clubCount = db.prepare(
      'SELECT COUNT(*) as count FROM clubs WHERE is_active = 1'
    ).get() as any;

    const newcomerPipeline = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'ATTEMPT' THEN 1 ELSE 0 END), 0) as ATTEMPT,
        COALESCE(SUM(CASE WHEN status = 'PRELIM' THEN 1 ELSE 0 END), 0) as PRELIM,
        COALESCE(SUM(CASE WHEN status = 'GOSPEL' THEN 1 ELSE 0 END), 0) as GOSPEL,
        COALESCE(SUM(CASE WHEN status = 'WORSHIP' THEN 1 ELSE 0 END), 0) as WORSHIP,
        COALESCE(SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END), 0) as COMPLETE,
        COALESCE(SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END), 0) as LOST
      FROM newcomers
    `).get();

    const recentUsers = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    const recentPosts = db.prepare(`
      SELECT p.id, p.title, p.board_type, p.created_at, u.name as author_name
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all();

    const pendingApplications = db.prepare(
      "SELECT COUNT(*) as count FROM club_applications WHERE status = 'PENDING'"
    ).get() as any;

    const missionStats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM mission_logs WHERE log_type = 'STREET') as street_count,
        (SELECT COUNT(*) FROM mission_logs WHERE log_type = 'PROMOTION') as promotion_count,
        (SELECT COALESCE(SUM(attempt_count), 0) FROM mission_logs) as total_attempts
    `).get();

    return Response.json({
      userCount: userCount.count,
      clubCount: clubCount.count,
      newcomerPipeline,
      pendingApplications: pendingApplications.count,
      missionStats,
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return Response.json({ error: '관리자 대시보드 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

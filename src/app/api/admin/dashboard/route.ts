import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await initDbAsync();

    const userCount = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    ).get() as any;

    const clubCount = db.prepare(
      'SELECT COUNT(*) as count FROM clubs WHERE is_active = 1'
    ).get() as any;

    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as any;

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

    const pendingUsers = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE is_approved = 0 AND is_active = 1"
    ).get() as any;

    const recentUsers = db.prepare(`
      SELECT id, name, phone, department, role, referral_source, is_approved, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    const recentPosts = db.prepare(`
      SELECT p.id, p.title, p.board_type, p.created_at, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id) as like_count
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all();

    // 오늘 통계 (today range)
    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;

    const todayStats = {
      newUsers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at BETWEEN ? AND ?").get(todayStart, todayEnd) as any).c,
      newPosts: (db.prepare("SELECT COUNT(*) as c FROM posts WHERE created_at BETWEEN ? AND ?").get(todayStart, todayEnd) as any).c,
      newComments: (db.prepare("SELECT COUNT(*) as c FROM comments WHERE created_at BETWEEN ? AND ?").get(todayStart, todayEnd) as any).c,
      newNewcomers: (db.prepare("SELECT COUNT(*) as c FROM newcomers WHERE created_at BETWEEN ? AND ?").get(todayStart, todayEnd) as any).c,
    };

    // 게시판별 글 수
    const boardPostCounts = db.prepare(`
      SELECT board_type, COUNT(*) as count
      FROM posts
      GROUP BY board_type
      ORDER BY count DESC
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

    const clubStats = db.prepare(`
      SELECT c.id, c.name, c.icon, c.icon_color,
        (SELECT COUNT(*) FROM newcomers n WHERE n.club_id = c.id) as newcomer_count
      FROM clubs c WHERE c.is_active = 1
      ORDER BY c.display_order
    `).all();

    return Response.json({
      userCount: userCount.count,
      clubCount: clubCount.count,
      postCount: postCount.count,
      newcomerPipeline,
      pendingApplications: pendingApplications.count,
      pendingUsers: pendingUsers.count,
      missionStats,
      recentUsers,
      recentPosts,
      clubStats,
      todayStats,
      boardPostCounts,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return Response.json({ error: '관리자 대시보드 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// GET: 통계 데이터 (일별/주별 가입자, 게시글, 댓글)
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await initDbAsync();

    // 최근 7일간 일별 통계
    const days = 7;
    const dailyStats: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const start = `${dateStr} 00:00:00`;
      const end = `${dateStr} 23:59:59`;

      const newUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at BETWEEN ? AND ?").get(start, end) as any;
      const newPosts = db.prepare("SELECT COUNT(*) as c FROM posts WHERE created_at BETWEEN ? AND ?").get(start, end) as any;
      const newComments = db.prepare("SELECT COUNT(*) as c FROM comments WHERE created_at BETWEEN ? AND ?").get(start, end) as any;

      dailyStats.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        newUsers: newUsers.c,
        newPosts: newPosts.c,
        newComments: newComments.c,
      });
    }

    // 게시판별 글 수
    const boardStats = db.prepare(`
      SELECT board_type, COUNT(*) as count
      FROM posts
      GROUP BY board_type
      ORDER BY count DESC
    `).all();

    // 등급별 회원 수
    const roleStats = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE is_active = 1
      GROUP BY role
    `).all();

    // 동아리별 멤버 수
    const clubStats = db.prepare(`
      SELECT c.id, c.name, c.icon, COUNT(cm.user_id) as member_count
      FROM clubs c
      LEFT JOIN club_members cm ON cm.club_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY member_count DESC
    `).all();

    // 전체 누적 통계
    const total = {
      users: (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 1').get() as any).c,
      posts: (db.prepare('SELECT COUNT(*) as c FROM posts').get() as any).c,
      comments: (db.prepare('SELECT COUNT(*) as c FROM comments').get() as any).c,
      newcomers: (db.prepare('SELECT COUNT(*) as c FROM newcomers').get() as any).c,
      clubs: (db.prepare('SELECT COUNT(*) as c FROM clubs WHERE is_active = 1').get() as any).c,
    };

    return Response.json({ dailyStats, boardStats, roleStats, clubStats, total });
  } catch (error: any) {
    console.error('Stats error:', error);
    return Response.json({ error: '통계 조회 중 오류', detail: error?.message }, { status: 500 });
  }
}

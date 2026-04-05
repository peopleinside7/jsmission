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

    const pipeline = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'ATTEMPT' THEN 1 ELSE 0 END), 0) as ATTEMPT,
        COALESCE(SUM(CASE WHEN status = 'PRELIM' THEN 1 ELSE 0 END), 0) as PRELIM,
        COALESCE(SUM(CASE WHEN status = 'GOSPEL' THEN 1 ELSE 0 END), 0) as GOSPEL,
        COALESCE(SUM(CASE WHEN status = 'WORSHIP' THEN 1 ELSE 0 END), 0) as WORSHIP,
        COALESCE(SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END), 0) as COMPLETE,
        COALESCE(SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END), 0) as LOST
      FROM newcomers
    `).get();

    // withList=true returns all newcomers (for prayer room, full list)
    const url = new URL(request.url);
    const withList = url.searchParams.get('withList') === 'true';

    let newcomers;
    if (withList) {
      newcomers = db.prepare(`
        SELECT n.*, c.name as club_name, c.icon as club_icon,
          u.name as registered_by_name
        FROM newcomers n
        LEFT JOIN clubs c ON c.id = n.club_id
        LEFT JOIN users u ON u.id = n.registered_by
        ORDER BY n.created_at DESC
      `).all();
    } else {
      newcomers = db.prepare(`
        SELECT n.*, c.name as club_name, c.icon as club_icon,
          u.name as registered_by_name
        FROM newcomers n
        LEFT JOIN clubs c ON c.id = n.club_id
        LEFT JOIN users u ON u.id = n.registered_by
        ORDER BY n.created_at DESC
        LIMIT 10
      `).all();
    }

    const clubStats = db.prepare(`
      SELECT c.id, c.name, c.icon, c.icon_color,
        COUNT(n.id) as total,
        SUM(CASE WHEN n.status = 'COMPLETE' THEN 1 ELSE 0 END) as complete_count
      FROM clubs c
      LEFT JOIN newcomers n ON n.club_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY total DESC
    `).all();

    return Response.json({ pipeline, newcomers, recentNewcomers: newcomers, clubStats });
  } catch (error) {
    console.error('Newcomer dashboard error:', error);
    return Response.json({ error: '대시보드 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

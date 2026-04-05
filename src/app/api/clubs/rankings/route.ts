import { initDbAsync } from '@/lib/db';

export async function GET() {
  try {
    const db = await initDbAsync();

    const rankings = db.prepare(`
      SELECT c.id, c.name, c.icon, c.icon_color, c.category,
        (SELECT COUNT(*) FROM club_members WHERE club_id = c.id) as member_count,
        (SELECT COUNT(*) FROM newcomers WHERE club_id = c.id) as newcomer_count,
        (SELECT COUNT(*) FROM club_sessions WHERE club_id = c.id) as session_count,
        (SELECT COUNT(*) FROM newcomers WHERE club_id = c.id AND status = 'COMPLETE') as complete_count
      FROM clubs c
      WHERE c.is_active = 1
      ORDER BY newcomer_count DESC, session_count DESC
    `).all();

    return Response.json({ rankings });
  } catch (error) {
    console.error('Rankings error:', error);
    return Response.json({ error: '랭킹 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

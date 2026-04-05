import { initDbAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDbAsync();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const clubCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;

    return Response.json({
      message: '데이터베이스 초기화가 완료되었습니다',
      stats: {
        users: userCount?.count || 0,
        clubs: clubCount?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Init error:', error);
    return Response.json({
      error: '초기화 중 오류가 발생했습니다',
      detail: error?.message || String(error),
      stack: error?.stack?.substring(0, 500),
    }, { status: 500 });
  }
}

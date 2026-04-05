import getDb from '@/lib/db';

export async function GET() {
  try {
    // Initialize DB (schema is created in getDb())
    const db = getDb();

    // Try to run seed if available
    try {
      const { seedDatabase } = await import('@/lib/seed');
      seedDatabase();
    } catch {
      // Seed module may not exist yet, that's ok
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const clubCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;

    return Response.json({
      message: '데이터베이스 초기화가 완료되었습니다',
      stats: {
        users: userCount.count,
        clubs: clubCount.count,
      },
    });
  } catch (error) {
    console.error('Init error:', error);
    return Response.json({ error: '초기화 중 오류가 발생했습니다' }, { status: 500 });
  }
}

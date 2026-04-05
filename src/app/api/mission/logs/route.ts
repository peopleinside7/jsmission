import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const url = new URL(request.url);
    const logType = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const db = await initDbAsync();

    let whereClause = '';
    const queryParams: any[] = [];

    if (logType) {
      whereClause = 'WHERE ml.log_type = ?';
      queryParams.push(logType.toUpperCase());
    }

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM mission_logs ml ${whereClause}`
    ).get(...queryParams) as any;

    const logs = db.prepare(`
      SELECT ml.*, u.name as user_name,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'MISSION_LOG' AND target_id = ml.id) as like_count
      FROM mission_logs ml
      JOIN users u ON u.id = ml.user_id
      ${whereClause}
      ORDER BY ml.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams, limit, offset);

    return Response.json({
      logs,
      total: total.count,
      page,
      totalPages: Math.ceil(total.count / limit),
    });
  } catch (error) {
    console.error('Mission logs error:', error);
    return Response.json({ error: '전도 로그 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const {
      log_type, appointment_id, content,
      location, result_summary, attempt_count, images,
    } = await request.json();

    if (!log_type || !content) {
      return Response.json({ error: '유형과 내용은 필수입니다' }, { status: 400 });
    }

    const db = await initDbAsync();

    const result = db.prepare(`
      INSERT INTO mission_logs (user_id, log_type, appointment_id, content, location, result_summary, attempt_count, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.userId, log_type, appointment_id || null, content,
      location || null, result_summary || null, attempt_count || 0,
      images ? JSON.stringify(images) : null
    );

    const log = db.prepare(`
      SELECT ml.*, u.name as user_name
      FROM mission_logs ml
      JOIN users u ON u.id = ml.user_id
      WHERE ml.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Mission log create error:', error);
    return Response.json({ error: '전도 로그 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

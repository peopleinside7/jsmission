import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const db = getDb();
    const userData = db.prepare(
      'SELECT id, name, email, phone, department, role, profile_image, is_active, created_at FROM users WHERE id = ?'
    ).get(user.userId) as any;

    if (!userData) {
      return Response.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return Response.json({ user: userData });
  } catch (error) {
    console.error('Me error:', error);
    return Response.json({ error: '사용자 정보 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

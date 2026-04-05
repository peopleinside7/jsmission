import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const refreshToken = (request as NextRequest).cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return Response.json({ error: '갱신 토큰이 없습니다' }, { status: 401 });
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      return Response.json({ error: '갱신 토큰이 만료되었습니다' }, { status: 401 });
    }

    const db = await initDbAsync();
    const user = db.prepare(
      'SELECT id, name, phone, role, is_active, is_approved FROM users WHERE id = ?'
    ).get(payload.userId) as any;

    if (!user || !user.is_active || !user.is_approved) {
      return Response.json({ error: '유효하지 않은 계정입니다' }, { status: 401 });
    }

    const tokens = generateTokens({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1800,
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json({ error: '토큰 갱신 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: '로그아웃 되었습니다' });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: '로그아웃 중 오류가 발생했습니다' }, { status: 500 });
  }
}

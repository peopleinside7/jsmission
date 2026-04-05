import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDbAsync } from '@/lib/db';
import { generateTokens } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return Response.json({ error: '이름과 비밀번호를 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();

    // sql.js에서 한글 파라미터 바인딩 이슈 우회: 전체 조회 후 필터
    const allUsers = db.prepare(
      'SELECT id, name, phone, password_hash, department, role, profile_image, login_attempts, locked_until, is_active, is_approved FROM users'
    ).all() as any[];

    const trimmedName = name.trim();
    const user = allUsers.find((u: any) => u.name === trimmedName);

    if (!user) {
      // Debug: show available names
      const names = allUsers.map((u: any) => u.name);
      return Response.json({
        error: '이름 또는 비밀번호가 올바르지 않습니다',
        debug_count: allUsers.length,
        debug_names: names,
        debug_input: trimmedName,
      }, { status: 401 });
    }

    if (!user.is_active) {
      return Response.json({ error: '비활성화된 계정입니다' }, { status: 403 });
    }

    // ADMIN은 승인 체크 건너뜀
    if (user.role !== 'ADMIN' && !user.is_approved) {
      return Response.json({ error: '관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.' }, { status: 403 });
    }

    // Check lock
    if (user.login_attempts >= 5 && user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        return Response.json({ error: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요' }, { status: 423 });
      }
      db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1;
      const lockedUntil = attempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
      db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockedUntil, user.id);

      return Response.json({
        error: '이름 또는 비밀번호가 올바르지 않습니다',
        remainingAttempts: Math.max(0, 5 - attempts),
      }, { status: 401 });
    }

    // Success
    db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        department: user.department,
        role: user.role,
        profile_image: user.profile_image,
      },
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1800,
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: '로그인 중 오류가 발생했습니다' }, { status: 500 });
  }
}

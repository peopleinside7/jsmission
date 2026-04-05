import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { generateTokens } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 });
    }

    const db = getDb();

    const user = db.prepare(
      'SELECT id, name, email, password_hash, phone, department, role, profile_image, login_attempts, locked_until, is_active FROM users WHERE email = ?'
    ).get(email) as any;

    if (!user) {
      return Response.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
    }

    if (!user.is_active) {
      return Response.json({ error: '비활성화된 계정입니다' }, { status: 403 });
    }

    // Check lock
    if (user.login_attempts >= 5 && user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        return Response.json({ error: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요' }, { status: 423 });
      }
      // Lock expired, reset
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
        error: '이메일 또는 비밀번호가 올바르지 않습니다',
        remainingAttempts: Math.max(0, 5 - attempts),
      }, { status: 401 });
    }

    // Success - reset attempts
    db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.role,
        profile_image: user.profile_image,
      },
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 1800,
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
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

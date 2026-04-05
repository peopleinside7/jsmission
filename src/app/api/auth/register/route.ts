import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { generateTokens } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, department } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: '이름, 이메일, 비밀번호는 필수입니다' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return Response.json({ error: '이미 등록된 이메일입니다' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, department) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, passwordHash, phone || null, department || null);

    const userId = result.lastInsertRowid as number;

    const { accessToken, refreshToken } = generateTokens({
      userId,
      email,
      role: 'USER',
      name,
    });

    const response = NextResponse.json({
      user: { id: userId, name, email, phone, department, role: 'USER' },
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
    console.error('Register error:', error);
    return Response.json({ error: '회원가입 중 오류가 발생했습니다' }, { status: 500 });
  }
}

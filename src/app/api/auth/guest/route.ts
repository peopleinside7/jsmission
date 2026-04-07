import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDbAsync } from '@/lib/db';
import { generateTokens } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = JSON.parse(await request.text());
    const { name } = body;

    if (!name || !name.trim()) {
      return Response.json({ error: '이름을 입력해주세요' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const db = await initDbAsync();

    // 테스트 계정 자동 생성 (이름 기반)
    const testPhone = `test-${Date.now()}`;
    const testPassword = 'test1234';
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 이미 같은 이름의 테스트 계정이 있는지 확인
    const allUsers = db.prepare('SELECT id, name, phone, role, is_approved FROM users').all() as any[];
    let user = allUsers.find((u: any) => u.name === trimmedName && u.is_approved);

    if (!user) {
      // 새 테스트 계정 생성 (자동 승인)
      const result = db.prepare(
        'INSERT INTO users (name, phone, password_hash, department, referral_source, is_approved, role) VALUES (?, ?, ?, ?, ?, 1, ?)'
      ).run(trimmedName, testPhone, passwordHash, '테스트', '테스트 입장', 'USER');

      user = {
        id: result.lastInsertRowid,
        name: trimmedName,
        phone: testPhone,
        role: 'USER',
      };
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id as number,
      phone: user.phone as string,
      role: user.role as string,
      name: user.name as string,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
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
    console.error('Guest login error:', error);
    return Response.json({ error: '테스트 입장 중 오류가 발생했습니다' }, { status: 500 });
  }
}

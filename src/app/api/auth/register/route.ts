import bcrypt from 'bcryptjs';
import { initDbAsync } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, phone, password, department, referral_source } = await request.json();

    if (!name || !phone || !password) {
      return Response.json({ error: '이름, 연락처, 비밀번호는 필수입니다' }, { status: 400 });
    }

    const db = await initDbAsync();

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return Response.json({ error: '이미 등록된 연락처입니다' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare(
      'INSERT INTO users (name, phone, password_hash, department, referral_source, is_approved) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(name, phone, passwordHash, department || null, referral_source || null);

    return Response.json({
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
      status: 'PENDING',
    });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: '회원가입 중 오류가 발생했습니다' }, { status: 500 });
  }
}

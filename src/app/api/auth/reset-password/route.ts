import bcrypt from 'bcryptjs';
import { initDbAsync } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getTokenFromRequest, generateTokens } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST /api/auth/reset-password
// Case 1: { phone } - Generate temp password (admin/self-service)
// Case 2: { currentPassword, newPassword } - Change password (authenticated)
export async function POST(request: Request) {
  try {
    const body = JSON.parse(await request.text());
    const db = await initDbAsync();

    // Case 1: Reset by phone (generate temporary password)
    if (body.phone && !body.newPassword) {
      const user = db.prepare('SELECT id, name, is_approved, is_active FROM users WHERE phone = ?').get(body.phone) as any;
      if (!user) {
        return Response.json({ error: '등록된 연락처를 찾을 수 없습니다' }, { status: 404 });
      }
      if (!user.is_active) {
        return Response.json({ error: '비활성화된 계정입니다' }, { status: 403 });
      }

      // Generate 6-digit temp password
      const tempPassword = String(Math.floor(100000 + Math.random() * 900000));
      const hash = await bcrypt.hash(tempPassword, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

      // In production, send SMS here. For demo, return temp password.
      return Response.json({
        message: '임시 비밀번호가 발급되었습니다.',
        tempPassword, // 실제 운영 시 SMS 발송 후 이 필드 제거
        notice: '로그인 후 비밀번호를 변경해주세요.',
      });
    }

    // Case 2: Change password (authenticated user)
    if (body.newPassword) {
      const user = getTokenFromRequest(request as NextRequest);
      if (!user) {
        return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
      }

      if (body.newPassword.length < 4) {
        return Response.json({ error: '비밀번호는 4자 이상이어야 합니다' }, { status: 400 });
      }

      const userData = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.userId) as any;

      // Verify current password if provided
      if (body.currentPassword) {
        const valid = await bcrypt.compare(body.currentPassword, userData.password_hash);
        if (!valid) {
          return Response.json({ error: '현재 비밀번호가 올바르지 않습니다' }, { status: 400 });
        }
      }

      const hash = await bcrypt.hash(body.newPassword, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.userId);

      return Response.json({ message: '비밀번호가 변경되었습니다' });
    }

    return Response.json({ error: '올바른 요청이 아닙니다' }, { status: 400 });
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json({ error: '비밀번호 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

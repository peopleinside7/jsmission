import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync, ensureUserExists } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    const body = JSON.parse(await request.text());
    const { name, phone, department } = body;
    if (!name?.trim()) return Response.json({ error: '이름은 필수입니다' }, { status: 400 });

    const db = await initDbAsync();
    await ensureUserExists(db, user);
    db.prepare('UPDATE users SET name = ?, phone = ?, department = ? WHERE id = ?')
      .run(name.trim(), phone || null, department || null, user.userId);

    const updated = db.prepare('SELECT id, name, phone, department, role FROM users WHERE id = ?').get(user.userId);
    return Response.json({ user: updated });
  } catch (error: any) {
    return Response.json({ error: '프로필 수정 실패', detail: error?.message }, { status: 500 });
  }
}

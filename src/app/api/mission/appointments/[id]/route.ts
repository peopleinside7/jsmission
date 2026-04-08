import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { id } = await params;
    const db = await initDbAsync();

    const appt = db.prepare('SELECT created_by FROM mission_appointments WHERE id = ?').get(id) as any;
    if (!appt) return Response.json({ error: '약속을 찾을 수 없습니다' }, { status: 404 });
    if (appt.created_by !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    db.prepare('DELETE FROM mission_logs WHERE appointment_id = ?').run(id);
    db.prepare('DELETE FROM mission_appointments WHERE id = ?').run(id);
    return Response.json({ message: '삭제되었습니다' });
  } catch (error) {
    console.error('Appointment delete error:', error);
    return Response.json({ error: '삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

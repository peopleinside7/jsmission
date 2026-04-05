import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const db = getDb();

    const appointments = db.prepare(`
      SELECT ma.*, u.name as creator_name
      FROM mission_appointments ma
      JOIN users u ON u.id = ma.created_by
      ORDER BY ma.appointment_date DESC, ma.start_time DESC
    `).all();

    return Response.json({ appointments });
  } catch (error) {
    console.error('Appointments list error:', error);
    return Response.json({ error: '약속 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const {
      appointment_type, title, description,
      appointment_date, start_time, location, participants,
    } = await request.json();

    if (!appointment_type || !title) {
      return Response.json({ error: '유형과 제목은 필수입니다' }, { status: 400 });
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO mission_appointments (appointment_type, title, description, appointment_date, start_time, location, created_by, participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appointment_type, title, description || null,
      appointment_date || null, start_time || null, location || null,
      user.userId, participants ? JSON.stringify(participants) : null
    );

    const appointment = db.prepare('SELECT * FROM mission_appointments WHERE id = ?').get(result.lastInsertRowid);

    return Response.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Appointment create error:', error);
    return Response.json({ error: '약속 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

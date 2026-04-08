import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync, ensureUserExists } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;

    // Parse body BEFORE any DB queries (request body can only be read once)
    let body: any = {};
    try {
      const bodyText = await request.text();
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      // If JSON parsing fails, use empty object
    }
    const { purpose, target_type, department, phone } = body;

    const db = await initDbAsync();
    await ensureUserExists(db, user);

    const club = db.prepare('SELECT * FROM clubs WHERE id = ? AND is_active = 1').get(id) as any;
    if (!club) {
      return Response.json({ error: '클럽을 찾을 수 없습니다' }, { status: 404 });
    }

    if (club.recruitment_status === 'CLOSED') {
      return Response.json({ error: '모집이 마감된 클럽입니다' }, { status: 400 });
    }

    // Check existing membership
    const existingMember = db.prepare(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
    ).get(id, user.userId);
    if (existingMember) {
      return Response.json({ error: '이미 가입된 클럽입니다' }, { status: 409 });
    }

    // Check pending application
    const existingApp = db.prepare(
      "SELECT id FROM club_applications WHERE club_id = ? AND user_id = ? AND status = 'PENDING'"
    ).get(id, user.userId);
    if (existingApp) {
      return Response.json({ error: '이미 신청 중입니다' }, { status: 409 });
    }

    if (club.approval_mode === 'AUTO') {
      // Auto approve
      db.prepare(
        "INSERT INTO club_applications (user_id, club_id, department, phone, purpose, target_type, status, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', datetime('now'))"
      ).run(user.userId, id, department || null, phone || null, purpose || null, target_type || null);

      db.prepare(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)'
      ).run(id, user.userId);

      return Response.json({ message: '자동 승인되었습니다', status: 'APPROVED' }, { status: 201 });
    }

    const result = db.prepare(
      'INSERT INTO club_applications (user_id, club_id, department, phone, purpose, target_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.userId, id, department || null, phone || null, purpose || null, target_type || null);

    return Response.json({
      message: '가입 신청이 완료되었습니다',
      applicationId: result.lastInsertRowid,
      status: 'PENDING',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Club apply error:', error);
    return Response.json({
      error: '클럽 신청 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const db = await initDbAsync();

    // Only ADMIN or club ADMIN can view applications
    if (user.role !== 'ADMIN') {
      const isClubAdmin = db.prepare(
        "SELECT id FROM club_members WHERE club_id = ? AND user_id = ? AND role = 'ADMIN'"
      ).get(id, user.userId);
      if (!isClubAdmin) {
        return Response.json({ error: '권한이 없습니다' }, { status: 403 });
      }
    }

    const applications = db.prepare(`
      SELECT ca.*, u.name as user_name, u.phone as user_phone, u.department as user_department
      FROM club_applications ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.club_id = ?
      ORDER BY ca.created_at DESC
    `).all(id);

    return Response.json({ applications });
  } catch (error) {
    console.error('Applications list error:', error);
    return Response.json({ error: '신청 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

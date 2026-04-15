import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// GET /api/admin/users - 전체 회원 목록 + 소속 동아리
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await initDbAsync();

    // 모든 회원 + 가입한 동아리 정보
    const users = db.prepare(`
      SELECT u.id, u.name, u.phone, u.department, u.role, u.referral_source,
        u.is_approved, u.is_active, u.created_at,
        u.approved_by, u.approved_at
      FROM users u
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
    `).all() as any[];

    // 각 회원의 소속 동아리 매핑
    const memberClubs = db.prepare(`
      SELECT cm.user_id, cm.club_id, cm.role as club_role,
        c.name as club_name, c.icon as club_icon
      FROM club_members cm
      JOIN clubs c ON c.id = cm.club_id
    `).all() as any[];

    const clubMap = new Map<number, any[]>();
    for (const mc of memberClubs) {
      if (!clubMap.has(mc.user_id)) clubMap.set(mc.user_id, []);
      clubMap.get(mc.user_id)!.push({
        club_id: mc.club_id,
        club_name: mc.club_name,
        club_icon: mc.club_icon,
        club_role: mc.club_role,
      });
    }

    const result = users.map(u => ({
      ...u,
      clubs: clubMap.get(u.id) || [],
    }));

    return Response.json({ users: result });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    return Response.json({
      error: '회원 목록 조회 중 오류가 발생했습니다',
      detail: error?.message,
    }, { status: 500 });
  }
}

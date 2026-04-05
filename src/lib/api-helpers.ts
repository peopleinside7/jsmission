import { NextRequest } from 'next/server';
import { getTokenFromRequest, TokenPayload } from './auth';

// Standardized API error response
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

// Auth guard - returns user or throws error response
export function requireAuth(request: Request): TokenPayload {
  const user = getTokenFromRequest(request as NextRequest);
  if (!user) throw apiError('로그인이 필요합니다', 401);
  return user;
}

// Admin guard
export function requireAdmin(request: Request): TokenPayload {
  const user = requireAuth(request);
  if (user.role !== 'ADMIN') throw apiError('관리자 권한이 필요합니다', 403);
  return user;
}

// Club member guard
export function checkClubMembership(db: any, clubId: string | number, userId: number, userRole: string): boolean {
  if (userRole === 'ADMIN') return true;
  const member = db.prepare(
    'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
  ).get(clubId, userId);
  return !!member;
}

// Input sanitization
export function sanitizeString(str: string | undefined | null, maxLength: number = 500): string | null {
  if (!str) return null;
  return str.trim().substring(0, maxLength);
}

// Validate ID parameter
export function validateId(id: string): number {
  const parsed = parseInt(id);
  if (isNaN(parsed) || parsed <= 0) throw apiError('올바르지 않은 ID입니다', 400);
  return parsed;
}

// Pagination helper
export function parsePagination(url: URL, defaultLimit: number = 20, maxLimit: number = 100) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit)) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

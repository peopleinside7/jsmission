import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/reset-password', '/api/auth/guest', '/api/init'];
const PUBLIC_PREFIXES = ['/api/files/', '/_next/', '/favicon.ico', '/logo_', '/sql-wasm.wasm'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Check for access token on protected routes
  const token = request.cookies.get('access_token')?.value;

  // API routes: return 401 JSON
  if (pathname.startsWith('/api/')) {
    if (!token) {
      // Allow some public API endpoints
      if (pathname === '/api/clubs' || pathname === '/api/clubs/rankings') {
        return NextResponse.next();
      }
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes: redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin pages: check minimum 1024px is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo_|sql-wasm).*)',
  ],
};

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.hwp': 'application/x-hwp',
  '.hwpx': 'application/x-hwpx',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    const filePath = path.join(UPLOAD_DIR, ...pathSegments);

    // Prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return Response.json({ error: '잘못된 파일 경로입니다' }, { status: 400 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return Response.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(resolvedPath);

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    };

    // Force download for SVG (XSS prevention) and other potentially dangerous types
    if (ext === '.svg' || ext === '.html' || ext === '.htm') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(resolvedPath)}"`;
    }

    return new Response(fileBuffer, { headers });
  } catch (error) {
    console.error('File serve error:', error);
    return Response.json({ error: '파일 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

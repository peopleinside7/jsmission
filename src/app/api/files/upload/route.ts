import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.hwp', '.hwpx',
];

export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: '파일을 선택해주세요' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: '파일 크기는 20MB를 초과할 수 없습니다' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return Response.json({ error: '허용되지 않는 파일 형식입니다' }, { status: 400 });
    }

    // Ensure upload dir exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return Response.json({
      fileName: file.name,
      filePath: `/api/files/${fileName}`,
      fileSize: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return Response.json({ error: '파일 업로드 중 오류가 발생했습니다' }, { status: 500 });
  }
}

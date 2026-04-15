import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// GET: 모든 설정/콘텐츠 조회
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await initDbAsync();

    // 테이블 보장
    try { db.exec('CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(100) PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)'); } catch {}

    const rows = db.prepare('SELECT key, value FROM app_settings').all() as any[];
    const settings: Record<string, string> = {};
    rows.forEach(r => { settings[r.key] = r.value || ''; });

    // 기본값 채우기
    const defaults: Record<string, string> = {
      app_name: 'JS MISSION',
      app_description: '안산주성령교회 문화선교 플랫폼',
      contact_phone: '',
      contact_email: '',
      banner_image: '',
      welcome_message: '오늘도 선교의 사명을 감당해주세요',
      footer_text: '© 2025 JS MISSION. All Rights Reserved.',
    };
    for (const k in defaults) {
      if (!(k in settings)) settings[k] = defaults[k];
    }

    return Response.json({ settings });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return Response.json({ error: '설정 조회 중 오류', detail: error?.message }, { status: 500 });
  }
}

// PUT: 설정 일괄 저장
export async function PUT(request: Request) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user || user.role !== 'ADMIN') {
      return Response.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = JSON.parse(await request.text());
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return Response.json({ error: 'settings 필드가 필요합니다' }, { status: 400 });
    }

    const db = await initDbAsync();
    try { db.exec('CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(100) PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)'); } catch {}

    const upsert = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, String(value || ''));
    }

    return Response.json({ message: '저장되었습니다' });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return Response.json({ error: '설정 저장 중 오류', detail: error?.message }, { status: 500 });
  }
}

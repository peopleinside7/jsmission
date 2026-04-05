import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

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

    const messages = db.prepare(`
      SELECT cm.*, u.name as user_name, u.profile_image
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = ?
      ORDER BY cm.created_at DESC
      LIMIT 100
    `).all(id);

    return Response.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Chat messages error:', error);
    return Response.json({ error: '채팅 메시지 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

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
    const { content, image_path } = await request.json();

    if (!content && !image_path) {
      return Response.json({ error: '메시지 내용을 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();

    const result = db.prepare(
      'INSERT INTO chat_messages (club_id, user_id, content, image_path) VALUES (?, ?, ?, ?)'
    ).run(id, user.userId, content || null, image_path || null);

    const message = db.prepare(`
      SELECT cm.*, u.name as user_name, u.profile_image
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Chat send error:', error);
    return Response.json({ error: '메시지 전송 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

function checkMembership(db: any, clubId: string, userId: number, userRole: string): boolean {
  if (userRole === 'ADMIN') return true;
  const member = db.prepare(
    'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?'
  ).get(clubId, userId);
  return !!member;
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

    if (!checkMembership(db, id, user.userId, user.role)) {
      return Response.json({ error: '동아리 멤버만 접근할 수 있습니다' }, { status: 403 });
    }

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
    const db = await initDbAsync();

    if (!checkMembership(db, id, user.userId, user.role)) {
      return Response.json({ error: '동아리 멤버만 메시지를 보낼 수 있습니다' }, { status: 403 });
    }

    const { content, image_path } = JSON.parse(await request.text());

    if (!content && !image_path) {
      return Response.json({ error: '메시지 내용을 입력해주세요' }, { status: 400 });
    }
    if (content && content.length > 500) {
      return Response.json({ error: '메시지는 500자 이하로 입력해주세요' }, { status: 400 });
    }

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

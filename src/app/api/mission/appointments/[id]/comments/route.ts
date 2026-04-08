import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

// mission_logs 테이블을 댓글 저장소로 활용
// appointment_id로 연결, content에 댓글 내용 저장

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

    const comments = db.prepare(`
      SELECT ml.id, ml.content, ml.created_at, ml.user_id,
        u.name as author_name
      FROM mission_logs ml
      JOIN users u ON u.id = ml.user_id
      WHERE ml.appointment_id = ?
      ORDER BY ml.created_at ASC
    `).all(id);

    return Response.json({ comments });
  } catch (error) {
    console.error('Appointment comments error:', error);
    return Response.json({ error: '댓글 조회 중 오류가 발생했습니다' }, { status: 500 });
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
    const body = JSON.parse(await request.text());
    const { content } = body;

    if (!content || !content.trim()) {
      return Response.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();

    // 약속이 존재하는지 확인
    const appt = db.prepare('SELECT id, appointment_type FROM mission_appointments WHERE id = ?').get(id) as any;
    if (!appt) {
      return Response.json({ error: '약속을 찾을 수 없습니다' }, { status: 404 });
    }

    const result = db.prepare(
      'INSERT INTO mission_logs (user_id, log_type, appointment_id, content) VALUES (?, ?, ?, ?)'
    ).run(user.userId, appt.appointment_type, id, content.trim());

    const comment = db.prepare(`
      SELECT ml.id, ml.content, ml.created_at, ml.user_id,
        u.name as author_name
      FROM mission_logs ml
      JOIN users u ON u.id = ml.user_id
      WHERE ml.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Appointment comment create error:', error);
    return Response.json({ error: '댓글 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { id } = await params;
    const body = JSON.parse(await request.text());
    const commentId = body.commentId;

    const db = await initDbAsync();
    const comment = db.prepare('SELECT user_id FROM mission_logs WHERE id = ?').get(commentId) as any;
    if (!comment) return Response.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    if (comment.user_id !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    db.prepare('DELETE FROM mission_logs WHERE id = ?').run(commentId);
    return Response.json({ message: '삭제되었습니다' });
  } catch (error) {
    console.error('Comment delete error:', error);
    return Response.json({ error: '삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

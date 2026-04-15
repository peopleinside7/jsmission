import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { commentId } = await params;
    const body = JSON.parse(await request.text());
    const { content } = body;

    if (!content || !content.trim()) {
      return Response.json({ error: '내용을 입력해주세요' }, { status: 400 });
    }
    if (content.length > 2000) {
      return Response.json({ error: '댓글은 2000자 이하로 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();
    const comment = db.prepare('SELECT author_id FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) return Response.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    if (comment.author_id !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(content.trim(), commentId);

    const updated = db.prepare(`
      SELECT c.*, u.name as author_name
      FROM comments c JOIN users u ON u.id = c.author_id
      WHERE c.id = ?
    `).get(commentId);

    return Response.json({ comment: updated });
  } catch (error) {
    console.error('Comment update error:', error);
    return Response.json({ error: '댓글 수정 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { commentId } = await params;
    const db = await initDbAsync();

    const comment = db.prepare('SELECT author_id FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) return Response.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 });
    if (comment.author_id !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    db.prepare('DELETE FROM comments WHERE parent_id = ?').run(commentId);
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    return Response.json({ message: '삭제되었습니다' });
  } catch (error) {
    console.error('Comment delete error:', error);
    return Response.json({ error: '삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

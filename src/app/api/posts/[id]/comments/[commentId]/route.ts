import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

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

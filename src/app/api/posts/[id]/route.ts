import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await initDbAsync();

    // Increment view count
    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(id);

    const user = getTokenFromRequest(request as NextRequest);
    const userId = user?.userId || 0;

    const post = db.prepare(`
      SELECT p.*, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id) as like_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.id = ?
    `).get(userId, id) as any;

    if (!post) {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    post.is_liked = post.is_liked > 0;

    return Response.json({ post });
  } catch (error) {
    console.error('Post detail error:', error);
    return Response.json({ error: '게시글 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PUT(
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

    const existing = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(id) as any;
    if (!existing) {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }
    if (existing.author_id !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const body = await request.json();
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['title', 'content', 'file_path', 'file_name', 'resource_category'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: '수정할 데이터가 없습니다' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    return Response.json({ post });
  } catch (error) {
    console.error('Post update error:', error);
    return Response.json({ error: '게시글 수정 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(id) as any;
    if (!existing) {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }
    if (existing.author_id !== user.userId && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(id);

    return Response.json({ message: '게시글이 삭제되었습니다' });
  } catch (error) {
    console.error('Post delete error:', error);
    return Response.json({ error: '게시글 삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

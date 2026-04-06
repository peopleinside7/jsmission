import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getTokenFromRequest(request as NextRequest);
    const userId = user?.userId || 0;

    const db = await initDbAsync();

    const allComments = db.prepare(`
      SELECT c.*, u.name as author_name,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'COMMENT' AND target_id = c.id) as like_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'COMMENT' AND target_id = c.id AND user_id = ?) as is_liked
      FROM comments c
      JOIN users u ON u.id = c.author_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(userId, id) as any[];

    // Build tree: top-level comments with nested replies
    const commentMap = new Map<number, any>();
    const topLevel: any[] = [];

    for (const c of allComments) {
      c.is_liked = c.is_liked > 0;
      c.replies = [];
      commentMap.set(c.id, c);
    }

    for (const c of allComments) {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(c);
      } else {
        topLevel.push(c);
      }
    }

    return Response.json({ comments: topLevel });
  } catch (error) {
    console.error('Comments list error:', error);
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
    const { content, parent_id } = JSON.parse(await request.text());

    if (!content) {
      return Response.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 });
    }
    if (content.length > 2000) {
      return Response.json({ error: '댓글은 2000자 이하로 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();

    // Verify post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    const result = db.prepare(
      'INSERT INTO comments (post_id, parent_id, author_id, content) VALUES (?, ?, ?, ?)'
    ).run(id, parent_id || null, user.userId, content);

    const comment = db.prepare(`
      SELECT c.*, u.name as author_name
      FROM comments c
      JOIN users u ON u.id = c.author_id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Comment create error:', error);
    return Response.json({ error: '댓글 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

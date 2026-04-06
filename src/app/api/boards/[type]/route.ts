import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { initDbAsync } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { type } = await params;
    const boardType = type.toUpperCase();

    const validTypes = ['NOTICE', 'SERMON', 'FREE', 'FEEDBACK', 'RESOURCE', 'CLUB_NOTICE'];
    if (!validTypes.includes(boardType)) {
      return Response.json({ error: '유효하지 않은 게시판 유형입니다' }, { status: 400 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const db = await initDbAsync();

    let whereClause = 'WHERE p.board_type = ?';
    const queryParams: any[] = [boardType];

    // FEEDBACK: only own posts unless admin
    if (boardType === 'FEEDBACK' && user.role !== 'ADMIN') {
      whereClause += ' AND p.author_id = ?';
      queryParams.push(user.userId);
    }

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM posts p ${whereClause}`
    ).get(...queryParams) as any;

    const posts = db.prepare(`
      SELECT p.*, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id) as like_count,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'POST' AND target_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.userId, ...queryParams, limit, offset);

    return Response.json({
      posts: posts.map((p: any) => ({ ...p, is_liked: p.is_liked > 0 })),
      total: total.count,
      page,
      totalPages: Math.ceil(total.count / limit),
    });
  } catch (error) {
    console.error('Board list error:', error);
    return Response.json({ error: '게시글 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const user = getTokenFromRequest(request as NextRequest);
    if (!user) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { type } = await params;
    const boardType = type.toUpperCase();

    // NOTICE and SERMON require ADMIN
    if ((boardType === 'NOTICE' || boardType === 'SERMON') && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const body = JSON.parse(await request.text());
    const { title, content, club_id, file_path, file_name, resource_category } = body;

    if (!title) {
      return Response.json({ error: '제목은 필수입니다' }, { status: 400 });
    }
    if (title.length > 200) {
      return Response.json({ error: '제목은 200자 이하로 입력해주세요' }, { status: 400 });
    }
    if (content && content.length > 10000) {
      return Response.json({ error: '내용은 10000자 이하로 입력해주세요' }, { status: 400 });
    }

    const db = await initDbAsync();

    const result = db.prepare(`
      INSERT INTO posts (board_type, club_id, author_id, title, content, file_path, file_name, resource_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      boardType, club_id || null, user.userId, title,
      content || null, file_path || null, file_name || null, resource_category || null
    );

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

    return Response.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Post create error:', error);
    return Response.json({ error: '게시글 작성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

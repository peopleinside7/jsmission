'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, MessageCircle, Heart } from 'lucide-react';
import type { Post } from '@/types';
import { formatDate } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { LayoutList } from 'lucide-react';

interface PostListProps {
  boardType: string;
  title: string;
}

export default function PostList({ boardType, title }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/boards/${boardType}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts ?? data);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [boardType]);

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-24 w-full" count={3} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<LayoutList size={48} />}
        title="게시글이 없습니다"
        description="첫 번째 글을 작성해 보세요."
      />
    );
  }

  return (
    <div className="px-4 space-y-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/boards/${boardType}/${post.id}`}
          className="block bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
        >
          <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 mb-2">
            {post.title}
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#999]">
              <span>{post.author_name}</span>
              <span>·</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#999]">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {post.view_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={14} />
                {post.comment_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={14} />
                {post.like_count ?? 0}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

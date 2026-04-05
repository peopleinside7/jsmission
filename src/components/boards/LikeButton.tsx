'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  postId: number;
  initialCount: number;
  initialLiked: boolean;
}

export default function LikeButton({ postId, initialCount, initialLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((prev) => prev + (nextLiked ? 1 : -1));

    if (nextLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    } catch {
      // revert on error
      setLiked(!nextLiked);
      setCount((prev) => prev + (nextLiked ? -1 : 1));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
        liked
          ? 'text-red-500 bg-red-50'
          : 'text-[#999] bg-[#F5F5F5] hover:bg-[#EEEEEE]'
      } ${isAnimating ? 'scale-110' : 'scale-100'}`}
    >
      <Heart
        size={16}
        fill={liked ? 'currentColor' : 'none'}
        className="transition-transform"
      />
      <span className="font-medium">{count}</span>
    </button>
  );
}

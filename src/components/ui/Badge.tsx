import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'red' | 'orange' | 'blue' | 'gray';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-[#E8F5E9] text-[#4CAF50]',
  red: 'bg-[#FFEBEE] text-[#E53935]',
  orange: 'bg-[#FFF3E0] text-[#FF9800]',
  blue: 'bg-[#E3F2FD] text-[#1976D2]',
  gray: 'bg-[#F5F5F5] text-[#999]',
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-[#999] mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[#333] mb-2">{title}</h3>
      <p className="text-sm text-[#999] leading-relaxed">{description}</p>
    </div>
  );
}

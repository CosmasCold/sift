// components/ui/GlassCard.tsx
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'interactive';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
}) => {
  const base =
    'bg-surface-800/60 backdrop-blur-xl border border-surface-700/50 shadow-glass rounded-2xl';
  const interactive =
    'transition-all duration-200 hover:bg-surface-800/80 hover:shadow-glass hover:-translate-y-0.5 cursor-pointer';

  return (
    <div
      className={`${base} ${variant === 'interactive' ? interactive : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
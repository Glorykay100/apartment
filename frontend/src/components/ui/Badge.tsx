import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline' | 'success' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-sand-200 text-forest-900 border border-linen',
    accent: 'bg-terracotta-500/10 text-terracotta-600 border border-terracotta-500/20 font-semibold',
    outline: 'border border-linen text-charcoal-700 bg-white/60 backdrop-blur-xs',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium',
    muted: 'bg-sand-200/60 text-charcoal-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wider uppercase rounded-md font-medium',
    md: 'text-xs px-3 py-1 tracking-wide rounded-full font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

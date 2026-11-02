import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-forest-900 text-sand-50 hover:bg-forest-800 active:bg-forest-950 shadow-sm',
      accent:
        'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-600 shadow-sm',
      outline:
        'border border-linen text-forest-900 bg-transparent hover:bg-sand-200 active:bg-sand-300',
      ghost:
        'text-charcoal-800 hover:bg-sand-200 active:bg-sand-300',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
      lg: 'text-base px-7 py-3.5 rounded-xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

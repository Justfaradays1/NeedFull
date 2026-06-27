'use client';

import { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  success?: boolean;
  successText?: string;
}

const variantStyles = {
  primary: 'bg-brand text-white shadow-card hover:bg-brand-mid active:scale-[0.97]',
  gold:    'bg-gold text-white shadow-card hover:brightness-105 active:scale-[0.97]',
  outline: 'bg-transparent text-brand border-[1.5px] border-brand hover:bg-brand-light active:scale-[0.97]',
  ghost:   'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.97]',
  danger:  'bg-danger text-white shadow-card hover:brightness-105 active:scale-[0.97]',
};

const sizeStyles = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[14px] gap-2',
  lg: 'h-[52px] px-6 text-[15px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, loading, success, successText, children, onClick, ...props }, ref) => {
    const [internalSuccess, setInternalSuccess] = useState(false);
    const showSuccess = success !== undefined ? success : internalSuccess;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled || showSuccess) return;
      onClick?.(e as any);
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center rounded-[10px] font-semibold',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          showSuccess && !loading && '!bg-green-500 !text-white !shadow-none !pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{successText || 'Done'}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

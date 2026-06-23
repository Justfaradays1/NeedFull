import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-brand text-white shadow-card hover:bg-brand-mid active:scale-[0.97]',
  gold:    'bg-gold text-white shadow-card hover:brightness-105 active:scale-[0.97]',
  outline: 'bg-transparent text-brand border-[1.5px] border-brand hover:bg-brand-light active:scale-[0.97]',
  ghost:   'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.97]',
  danger:  'bg-danger text-white shadow-card hover:brightness-105 active:scale-[0.97]',
}

const sizeStyles = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[14px] gap-2',
  lg: 'h-[52px] px-6 text-[15px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-[10px] font-semibold',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

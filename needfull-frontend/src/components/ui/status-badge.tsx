type Variant =
  | 'success' | 'completed' | 'verified'
  | 'pending' | 'processing' | 'in-review'
  | 'warning' | 'attention'
  | 'error' | 'failed' | 'danger'
  | 'info'
  | 'disabled' | 'inactive'
  | 'premium';

const variantStyles: Record<string, string> = {
  success:   'bg-success-light text-success',
  completed: 'bg-success-light text-success',
  verified:  'bg-success-light text-success',
  pending:   'bg-warning-light text-warning',
  processing:'bg-processing-light text-processing',
  'in-review':'bg-warning-light text-warning',
  warning:   'bg-warning-light text-warning',
  attention: 'bg-attention-light text-attention',
  error:     'bg-error-light text-error',
  failed:    'bg-error-light text-error',
  danger:    'bg-error-light text-error',
  info:      'bg-processing-light text-processing',
  disabled:  'bg-gray-100 text-gray-500',
  inactive:  'bg-gray-100 text-gray-500',
  premium:   'bg-gold-light text-gold-dark',
};

interface StatusBadgeProps {
  variant: Variant;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ variant, label, children, className = '', dot = false }: StatusBadgeProps) {
  const styles = variantStyles[variant] || variantStyles.info;
  const text = label || (typeof children === 'string' ? children : variant);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-tight ${styles} ${className}`}
      aria-label={typeof text === 'string' ? text : variant}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {text}
      {children && typeof children !== 'string' && children}
    </span>
  );
}

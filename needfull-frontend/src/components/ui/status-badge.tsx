type Variant =
  | 'success' | 'completed' | 'verified'
  | 'pending' | 'processing' | 'in-review'
  | 'warning' | 'attention'
  | 'error' | 'failed' | 'danger'
  | 'info'
  | 'disabled' | 'inactive'
  | 'premium';

const variantStyles: Record<string, string> = {
  success:   'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  verified:  'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  processing:'bg-blue-100 text-blue-700',
  'in-review':'bg-amber-100 text-amber-700',
  warning:   'bg-amber-100 text-amber-700',
  attention: 'bg-orange-100 text-orange-700',
  error:     'bg-red-100 text-red-700',
  failed:    'bg-red-100 text-red-700',
  danger:    'bg-red-100 text-red-700',
  info:      'bg-blue-100 text-blue-700',
  disabled:  'bg-gray-100 text-gray-500',
  inactive:  'bg-gray-100 text-gray-500',
  premium:   'bg-purple-100 text-purple-700',
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

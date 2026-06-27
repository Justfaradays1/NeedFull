import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center py-16 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-lg font-bold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

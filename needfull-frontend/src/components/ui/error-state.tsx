'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t complete that request. Please try again.',
  retry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center py-16 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-lg font-bold text-gray-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{message}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="tap-target mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

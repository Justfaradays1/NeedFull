'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmationDialog({
  open, onConfirm, onCancel, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading = false,
}: ConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const iconColor = variant === 'danger' ? 'text-red-500 bg-red-100'
    : variant === 'warning' ? 'text-amber-500 bg-amber-100'
    : 'text-blue-500 bg-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="fixed inset-0 glass-overlay" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-lifted animate-in fade-in zoom-in-95">
        <button
          type="button" onClick={onCancel}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconColor}`}>
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <h3 id="dialog-title" className="text-center font-display text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-center text-sm text-gray-500">{message}</p>

        <div className="mt-6 flex gap-3">
          <Button ref={cancelRef} variant="ghost" size="md" onClick={onCancel} disabled={loading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'gold' : 'primary'}
            size="md" onClick={onConfirm} loading={loading} className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

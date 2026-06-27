import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export function showToast(message: string, type: 'success' | 'error' | 'loading' | 'info' | 'warning' = 'info', duration?: number) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  };
  const Icon = icons[type];

  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-lifted border border-gray-100 transition-all duration-300 ${
          t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out'
        }`}
        style={{
          maxWidth: '380px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          type === 'success' ? 'bg-green-100 text-green-600' :
          type === 'error' ? 'bg-red-100 text-red-600' :
          type === 'warning' ? 'bg-amber-100 text-amber-600' :
          type === 'loading' ? 'bg-blue-100 text-blue-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {type === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : Icon ? (
            <Icon className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-semibold text-gray-900">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="tap-target mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    ),
    { duration: duration || (type === 'error' ? 4000 : type === 'loading' ? 30000 : 3000) },
  );
}

export function showSuccessToast(message: string) {
  toast.success(message, { duration: 3000 });
}

export function showErrorToast(message: string) {
  toast.error(message, { duration: 4000 });
}

export function showLoadingToast(message: string) {
  return toast.loading(message);
}

export function dismissToast(toastId?: string) {
  if (toastId) toast.dismiss(toastId);
  else toast.dismiss();
}

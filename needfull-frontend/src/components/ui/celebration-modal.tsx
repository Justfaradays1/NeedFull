'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, BadgeCheck, Banknote, X } from 'lucide-react';
import type { CelebrationConfig, CelebrationIcon } from '@/lib/celebration-content';

interface CelebrationModalProps {
  open: boolean;
  onClose: () => void;
  config: CelebrationConfig | null;
}

const iconMap: Record<CelebrationIcon, { icon: typeof CheckCircle2; bg: string; fg: string }> = {
  celebration: { icon: Sparkles, bg: 'bg-brand-light', fg: 'text-brand' },
  success: { icon: CheckCircle2, bg: 'bg-brand-light', fg: 'text-brand' },
  verified: { icon: BadgeCheck, bg: 'bg-gold-light', fg: 'text-gold' },
  payment: { icon: Banknote, bg: 'bg-green-100', fg: 'text-green-600' },
};

export function CelebrationModal({ open, onClose, config }: CelebrationModalProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  const handlePrimary = useCallback(() => {
    if (!config) return;
    if (config.primaryAction) {
      config.primaryAction();
    } else if (config.primaryHref) {
      router.push(config.primaryHref);
    }
    onClose();
  }, [config, router, onClose]);

  const handleSecondary = useCallback(() => {
    if (!config) return;
    if (config.secondaryAction) {
      config.secondaryAction();
    } else if (config.secondaryHref) {
      router.push(config.secondaryHref);
    }
    onClose();
  }, [config, router, onClose]);

  useEffect(() => {
    if (!open) { firedRef.current = false; return; }

    cardRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && config?.primaryLabel) handlePrimary();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, config?.primaryLabel, handlePrimary]);

  useEffect(() => {
    if (!open || !config?.confetti || firedRef.current) return;
    firedRef.current = true;

    import('canvas-confetti').then((confetti) => {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      confetti.default({ ...defaults, particleCount: 50, origin: { x: 0.5, y: 0.4 } });
      confetti.default({ ...defaults, particleCount: 30, origin: { x: 0.3, y: 0.5 }, colors: ['#1A6B4A', '#EAA325'] });
      confetti.default({ ...defaults, particleCount: 30, origin: { x: 0.7, y: 0.5 }, colors: ['#1A6B4A', '#EAA325'] });
    }).catch(() => {});
  }, [open, config?.confetti]);

  useEffect(() => {
    if (!open || !config?.primaryLabel) return;
    const auto = config.confetti ? 6000 : 4000;
    const id = setTimeout(() => { if (open) handlePrimary(); }, auto);
    return () => clearTimeout(id);
  }, [open, config?.primaryLabel, config?.confetti, handlePrimary]);

  if (!open || !config) return null;

  const iconInfo = iconMap[config.icon] || iconMap.success;
  const Icon = iconInfo.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        className="relative w-full max-w-sm animate-scale-in rounded-3xl bg-surface p-8 text-center shadow-lifted border border-card-border"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-5 flex h-20 w-20 animate-pop-in items-center justify-center rounded-full [animation-delay:150ms]">
          <div className={`flex h-full w-full items-center justify-center rounded-full ${iconInfo.bg}`}>
            <Icon className={`h-10 w-10 ${iconInfo.fg}`} aria-hidden="true" />
          </div>
        </div>

        <h2
          id="celebration-title"
          className="animate-fade-slide-up font-display text-2xl font-bold text-gray-900 [animation-delay:350ms]"
        >
          {config.title}
        </h2>

        <p className="mt-3 animate-fade-slide-up text-sm leading-relaxed text-gray-600 [animation-delay:500ms]">
          {config.description}
        </p>

        <div className="mt-8 animate-fade-slide-up space-y-3 [animation-delay:650ms]">
          {config.primaryLabel && (
            <button
              type="button"
              onClick={handlePrimary}
              className="tap-target w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white shadow-sm hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {config.primaryLabel}
            </button>
          )}
          {config.secondaryLabel && (
            <button
              type="button"
              onClick={handleSecondary}
              className="tap-target w-full rounded-xl border border-gray-300 bg-surface py-3.5 text-base font-semibold text-gray-600 hover:bg-gray-50"
            >
              {config.secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

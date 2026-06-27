import { Info, Lightbulb, AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

type Variant = 'info' | 'tip' | 'attention' | 'important' | 'warning' | 'success';

const config: Record<Variant, { cssClass: string; label: string }> = {
  info:      { cssClass: 'callout-info',      label: 'Info' },
  tip:       { cssClass: 'callout-tip',       label: 'Tip' },
  attention: { cssClass: 'callout-attention',  label: 'Attention' },
  important: { cssClass: 'callout-important',  label: 'Important' },
  warning:   { cssClass: 'callout-warning',    label: 'Warning' },
  success:   { cssClass: 'callout-success',    label: 'Success' },
};

const icons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  info:      Info,
  tip:       Lightbulb,
  attention: AlertTriangle,
  important: AlertCircle,
  warning:   ShieldAlert,
  success:   CheckCircle2,
};

interface CalloutProps {
  variant?: Variant;
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({ variant = 'info', label, children, className = '' }: CalloutProps) {
  const Icon = icons[variant];
  const cfg = config[variant];
  return (
    <div role="alert" aria-label={label || cfg.label}
      className={`callout ${cfg.cssClass} ${className}`}
    >
      <Icon className="callout-icon" aria-hidden="true" />
      <div className="min-w-0">
        {(label || cfg.label) && (
          <p className="font-bold text-inherit mb-0.5">{label || cfg.label}</p>
        )}
        <div className="text-inherit opacity-90">{children}</div>
      </div>
    </div>
  );
}

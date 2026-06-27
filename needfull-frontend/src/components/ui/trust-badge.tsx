import { Shield, ShieldCheck, Lock, BadgeCheck } from 'lucide-react';

type TrustVariant = 'secure' | 'verified' | 'escrow' | 'identity' | 'encrypted';

const config: Record<TrustVariant, { icon: React.ComponentType<{ className?: string }>; defaultLabel: string; description: string }> = {
  secure:    { icon: Lock,        defaultLabel: 'Secure connection',     description: 'Your data is encrypted and protected' },
  verified:  { icon: BadgeCheck,  defaultLabel: 'Verified student',      description: 'Student identity confirmed' },
  escrow:    { icon: ShieldCheck, defaultLabel: 'Escrow protection',     description: 'Funds held safely until completion' },
  identity:  { icon: Shield,      defaultLabel: 'Identity verified',     description: 'User identity has been verified' },
  encrypted: { icon: Lock,        defaultLabel: 'End-to-end encrypted',  description: 'Messages are private and secure' },
};

interface TrustBadgeProps {
  variant?: TrustVariant;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TrustBadge({ variant = 'secure', label, description, size = 'sm', className = '' }: TrustBadgeProps) {
  const cfg = config[variant];
  const Icon = cfg.icon;
  const isSmall = size === 'sm';
  const iconContainerSize = isSmall ? 'h-5 w-5' : 'h-6 w-6';
  const iconSize = isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={`flex items-start gap-2 ${isSmall ? 'text-[12px]' : 'text-sm'} ${className}`}>
      <div className={`flex shrink-0 items-center justify-center rounded-full ${
        variant === 'verified' ? 'bg-blue-100 text-blue-600' :
        variant === 'escrow' ? 'bg-green-100 text-green-600' :
        variant === 'secure' ? 'bg-brand-light text-brand' :
        variant === 'encrypted' ? 'bg-purple-100 text-purple-600' :
        'bg-amber-100 text-amber-600'
      } ${iconContainerSize}`}>
        <Icon className={iconSize} aria-hidden="true" />
      </div>
      <div>
        <p className="font-bold text-gray-700 leading-snug">{label || cfg.defaultLabel}</p>
        {description && <p className="font-medium text-gray-500 leading-snug mt-0.5">{description || cfg.description}</p>}
      </div>
    </div>
  );
}

interface TrustIndicatorsProps {
  horizontal?: boolean;
  className?: string;
}

export function TrustIndicators({ horizontal = false, className = '' }: TrustIndicatorsProps) {
  return (
    <div className={className}>
      {horizontal ? (
        <div className="flex flex-nowrap items-center gap-3">
          <TrustBadge variant="secure" size="sm" />
          <TrustBadge variant="escrow" label="Escrow protection" size="sm" />
          <TrustBadge variant="encrypted" size="sm" />
        </div>
      ) : (
        <div className="space-y-2.5">
          <TrustBadge variant="secure" size="sm" />
          <TrustBadge variant="escrow" label="Escrow protection" description="Payment held until task is complete" size="sm" />
          <TrustBadge variant="encrypted" size="sm" />
        </div>
      )}
    </div>
  );
}

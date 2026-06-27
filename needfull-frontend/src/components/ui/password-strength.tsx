'use client';

import { getPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor, getPasswordStrengthTextColor, getPasswordErrors } from '@/lib/validation';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const label = getPasswordStrengthLabel(strength);
  const barColor = getPasswordStrengthColor(strength);
  const textColor = getPasswordStrengthTextColor(strength);
  const errors = getPasswordErrors(password);

  if (!password) return null;

  const barWidth = strength === 'weak' ? '25%' : strength === 'fair' ? '50%' : strength === 'strong' ? '75%' : '100%';

  return (
    <div className="mt-2 space-y-1.5" role="status" aria-label={`Password strength: ${label}`}>
      <div className="flex items-center justify-between">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: barWidth }}
          />
        </div>
        <span className={`ml-2 text-[11px] font-semibold ${textColor} shrink-0`}>{label}</span>
      </div>
      {strength !== 'very-strong' && errors.length > 0 && (
        <ul className="space-y-0.5">
          {errors.map((err, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-1 w-1 rounded-full bg-gray-400" aria-hidden="true" />
              {err}
            </li>
          ))}
        </ul>
      )}
      {strength === 'very-strong' && (
        <p className="flex items-center gap-1 text-[11px] text-green-600">
          <span aria-hidden="true">✓</span> Password is very strong
        </p>
      )}
    </div>
  );
}

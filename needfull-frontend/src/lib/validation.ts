export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUpper: /[A-Z]/,
  requireLower: /[a-z]/,
  requireNumber: /[0-9]/,
  requireSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
} as const;

export const NG_PHONE_REGEX = /^(\+?234)[\s\-]?0?[\s\-]?[\d]{3}[\s\-]?[\d]{3}[\s\-]?[\d]{3,4}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_RULES.minLength &&
    PASSWORD_RULES.requireUpper.test(password) &&
    PASSWORD_RULES.requireLower.test(password) &&
    PASSWORD_RULES.requireNumber.test(password) &&
    PASSWORD_RULES.requireSpecial.test(password)
  );
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';

  let score = 0;
  if (password.length >= PASSWORD_RULES.minLength) score += 1;
  if (password.length >= 12) score += 1;
  if (PASSWORD_RULES.requireUpper.test(password)) score += 1;
  if (PASSWORD_RULES.requireLower.test(password)) score += 1;
  if (PASSWORD_RULES.requireNumber.test(password)) score += 1;
  if (PASSWORD_RULES.requireSpecial.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'strong';
  return 'very-strong';
}

export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak': return 'Weak';
    case 'fair': return 'Fair';
    case 'strong': return 'Strong';
    case 'very-strong': return 'Very strong';
    default: return '';
  }
}

export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak': return 'bg-red-500';
    case 'fair': return 'bg-amber-500';
    case 'strong': return 'bg-green-500';
    case 'very-strong': return 'bg-brand';
    default: return 'bg-gray-200';
  }
}

export function getPasswordStrengthTextColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak': return 'text-red-600';
    case 'fair': return 'text-amber-600';
    case 'strong': return 'text-green-600';
    case 'very-strong': return 'text-brand';
    default: return 'text-gray-400';
  }
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (!password) return [];
  if (password.length < PASSWORD_RULES.minLength)
    errors.push(`At least ${PASSWORD_RULES.minLength} characters`);
  if (!PASSWORD_RULES.requireUpper.test(password))
    errors.push('One uppercase letter');
  if (!PASSWORD_RULES.requireLower.test(password))
    errors.push('One lowercase letter');
  if (!PASSWORD_RULES.requireNumber.test(password))
    errors.push('One number');
  if (!PASSWORD_RULES.requireSpecial.test(password))
    errors.push('One special character');
  return errors;
}

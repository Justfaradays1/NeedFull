// WHAT: Utility functions for trust score display
// WHY: Consistent trust level mapping across components

interface TrustLevelInfo {
  label: string;
  color: string; // Tailwind text color
  bg: string; // Tailwind background color
  icon: string; // Lucide icon name
}

export function getTrustLevel(score: number): TrustLevelInfo {
  if (score >= 85)
    return {
      label: 'Trusted',
      color: 'text-success-text',
      bg: 'bg-success-bg',
      icon: 'shield-check',
    };
  if (score >= 65)
    return {
      label: 'Reliable',
      color: 'text-success-text',
      bg: 'bg-success-bg',
      icon: 'check-circle',
    };
  if (score >= 45)
    return {
      label: 'Building',
      color: 'text-warning-text',
      bg: 'bg-warning-bg',
      icon: 'trending-up',
    };
  if (score >= 25)
    return {
      label: 'New',
      color: 'text-info-text',
      bg: 'bg-info-bg',
      icon: 'user-plus',
    };
  return {
    label: 'At Risk',
    color: 'text-error-text',
    bg: 'bg-error-bg',
    icon: 'alert-triangle',
  };
}

export function getTrustScoreColor(score: number): string {
  if (score >= 85) return 'text-success-text';
  if (score >= 65) return 'text-success-text';
  if (score >= 45) return 'text-warning-text';
  if (score >= 25) return 'text-info-text';
  return 'text-error-text';
}

export function getTrustProgressBarColor(score: number): string {
  if (score >= 85) return 'bg-success';
  if (score >= 65) return 'bg-success';
  if (score >= 45) return 'bg-warning';
  if (score >= 25) return 'bg-processing';
  return 'bg-error';
}

export function getTrustGradient(score: number): string {
  if (score >= 65) return 'bg-success-bg';
  if (score >= 45) return 'bg-warning-bg';
  if (score >= 25) return 'bg-info-bg';
  return 'bg-error-bg';
}

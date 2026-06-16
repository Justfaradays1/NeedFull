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
      color: 'text-green-700',
      bg: 'bg-green-50',
      icon: 'shield-check',
    };
  if (score >= 65)
    return {
      label: 'Reliable',
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: 'check-circle',
    };
  if (score >= 45)
    return {
      label: 'Building',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: 'trending-up',
    };
  if (score >= 25)
    return {
      label: 'New',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: 'user-plus',
    };
  return {
    label: 'At Risk',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: 'alert-triangle',
  };
}

export function getTrustScoreColor(score: number): string {
  if (score >= 85) return 'text-green-700';
  if (score >= 65) return 'text-green-600';
  if (score >= 45) return 'text-amber-600';
  if (score >= 25) return 'text-blue-600';
  return 'text-red-700';
}

export function getTrustProgressBarColor(score: number): string {
  if (score >= 85) return 'bg-green-600';
  if (score >= 65) return 'bg-green-500';
  if (score >= 45) return 'bg-amber-500';
  if (score >= 25) return 'bg-blue-500';
  return 'bg-red-600';
}

export function getTrustGradient(score: number): string {
  if (score >= 65) return 'from-green-50 to-emerald-50';
  if (score >= 45) return 'from-amber-50 to-orange-50';
  if (score >= 25) return 'from-blue-50 to-cyan-50';
  return 'from-red-50 to-orange-50';
}

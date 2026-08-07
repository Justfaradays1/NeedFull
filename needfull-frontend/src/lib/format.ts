export const EARNINGS_TYPES = [
  "escrow_release",
  "earnings",
  "purchase_escrow_release",
  "purchase_runner_fee",
  "purchase_item_reimbursement",
] as const;

export const EARNINGS_WITHDRAWAL_TYPES = [
  "earnings_withdrawal",
  "withdrawal_failed_refund",
] as const;

export function isEarningsType(type: string): boolean {
  return (EARNINGS_TYPES as readonly string[]).includes(type);
}

export function formatCurrency(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// WHAT: "just now / 5m ago / 3h ago / 2d ago / 14 Sep"
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

// WHAT: "820m away / 2.1km away" — meters from the runner's saved location
export function formatDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

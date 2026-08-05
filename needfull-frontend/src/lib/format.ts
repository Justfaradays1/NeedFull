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

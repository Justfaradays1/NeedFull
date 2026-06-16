// WHAT: Platform-wide business and system constants
// WHY: Centralised source for magic numbers, fee structures, and business rules, prevents hardcoded values scattered throughout codebase
// FUTURE: Move LOAN_TIERS to database for dynamic configuration, add tiered feature access levels, add geographic fee adjustments

import env from "./env.js";

// WHAT: Financial constants (all amounts in KOBO, never naira decimals)
// WHY: Integer arithmetic prevents floating-point precision errors in money calculations
export const PLATFORM_FEE_PERCENT = parseInt(
  env.PLATFORM_FEE_PERCENT.toString(),
  10,
);
export const WITHDRAWAL_FEE_KOBO = parseInt(
  env.WITHDRAWAL_FEE_KOBO.toString(),
  10,
);

export const MIN_TASK_BUDGET_KOBO = 5000; // ₦50 minimum
export const MIN_DEPOSIT_KOBO = 10000; // ₦100 minimum

// WHAT: Trust score range and defaults
// WHY: Gamification mechanism to encourage quality work and platform participation
export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 100;
export const TRUST_SCORE_DEFAULT = 50;

// WHAT: Loan tier eligibility matrix (trust score threshold → borrowing limits and interest rates)
// WHY: Lower trust scores get stricter limits and higher interest; incentivises good behaviour
// FUTURE: Add dynamic tiers based on platform data, add reputation decay over time
export const LOAN_TIERS = {
  0: {
    minTrust: 0,
    maxKobo: 100000, // ₦1000
    interestRate: 0.15, // 15%
  },
  1: {
    minTrust: 40,
    maxKobo: 300000, // ₦3000
    interestRate: 0.12, // 12%
  },
  2: {
    minTrust: 60,
    maxKobo: 750000, // ₦7500
    interestRate: 0.08, // 8%
  },
  3: {
    minTrust: 80,
    maxKobo: 1500000, // ₦15000
    interestRate: 0.05, // 5%
  },
} as const;

// WHAT: Referral incentive (awarded to both referrer and new user)
// WHY: Growth mechanism to bootstrap user acquisition
export const REFERRAL_REWARD_KOBO = 20000; // ₦200

// WHAT: Loyalty program tiers (credit accumulation → bonus)
// WHY: Incentivises repeat task completion and platform engagement
// FUTURE: Add tier-based status badges, add loyalty milestone notifications
export const LOYALTY_CREDITS_PER_TASK = 50;
export const LOYALTY_CREDITS_THRESHOLD = 500;
export const LOYALTY_BONUS_KOBO = 25000; // ₦250

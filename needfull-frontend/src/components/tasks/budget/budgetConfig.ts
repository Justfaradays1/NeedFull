// WHAT: Budget configuration helpers — derived from canonical category config
// WHY: Single source of truth for all budget-related calculations

import { getCategoryConfig, type CategoryConfig } from "@/lib/categoryConfig";

export interface CategoryBudgetConfig {
  min: number;
  max: number;
  suggestions: number[];
  needsDualLocation: boolean;
  fairRange: { min: number; max: number };
  excellentRange: { min: number; max: number };
}

export function getCategoryBudgetConfig(categoryName: string): CategoryBudgetConfig {
  const config = getCategoryConfig(categoryName);
  return {
    min: config.budget.min,
    max: config.budget.max,
    suggestions: config.budget.suggestions,
    needsDualLocation: config.needsDualLocation,
    fairRange: config.budget.fairRange,
    excellentRange: config.budget.excellentRange,
  };
}

export function getPricingGuidance(
  amount: number,
  config: CategoryBudgetConfig,
): { level: "excellent" | "fair" | "low"; color: string; label: string } {
  if (amount <= 0) return { level: "low", color: "text-gray-400", label: "" };
  if (amount >= config.excellentRange.min) {
    return {
      level: "excellent",
      color: "text-success-text",
      label: "Excellent Offer — your budget is likely to attract many NeedRunners quickly.",
    };
  }
  if (amount >= config.fairRange.min) {
    return {
      level: "fair",
      color: "text-warning-text",
      label: "Fair Offer — your budget is reasonable but may receive fewer applicants.",
    };
  }
  return {
    level: "low",
    color: "text-error-text",
    label: "Low Offer — consider increasing your budget to attract more qualified NeedRunners.",
  };
}

export const PLATFORM_FEE_PERCENT = 10;

export function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${Math.round(amount).toLocaleString("en-NG")}`;
  return `₦${amount || 0}`;
}

export function parseNairaInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

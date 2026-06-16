// WHAT: Compact trust score badge for inline display
// WHY: Show user's trust level on task cards, user profiles, and chat headers

import { getTrustLevel, getTrustScoreColor } from "@/lib/utils/trust";

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// WHAT: Map size to CSS classes
const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

// WHAT: Compact badge showing trust level
// WHY: Lightweight component for displaying trust score inline
export function TrustBadge({
  score,
  size = "md",
  showLabel = true,
}: TrustBadgeProps) {
  const trustLevel = getTrustLevel(score);
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]} ${trustLevel.bg} ${trustLevel.color}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${trustLevel.color === "text-green-700" || trustLevel.color === "text-green-600" ? "bg-green-600" : trustLevel.color === "text-amber-600" ? "bg-amber-500" : trustLevel.color === "text-blue-600" ? "bg-blue-500" : "bg-red-600"}`}
      />
      {showLabel ? (
        <>
          {trustLevel.label}
          <span className="text-opacity-75">({clampedScore})</span>
        </>
      ) : (
        <span>{clampedScore}</span>
      )}
    </div>
  );
}

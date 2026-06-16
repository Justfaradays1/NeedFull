// WHAT: Trust score display card with level badge, progress bar, and optional breakdown
// WHY: Prominent trust score visualization for user profiles, task cards, and marketplace

'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { getTrustLevel, getTrustScoreColor, getTrustProgressBarColor, getTrustGradient } from '@/lib/utils/trust';

interface TrustScoreBreakdown {
  ratingPoints: number;
  completionPoints: number;
  verificationPoints: number;
  reportPenalty: number;
  tenurePoints: number;
}

interface TrustScoreCardProps {
  score: number;
  breakdown?: TrustScoreBreakdown;
  className?: string;
  showHowItWorks?: boolean;
}

// WHAT: Factor row for breakdown display
// WHY: Clear visualization of each trust factor contribution
function FactorRow({
  label,
  points,
  max,
  icon,
}: {
  label: string;
  points: number;
  max: number;
  icon: React.ReactNode;
}) {
  const percentage = (Math.abs(points) / max) * 100;
  const isNegative = points < 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0 text-gray-500">{icon}</div>
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700 font-medium">{label}</span>
          <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {isNegative ? '−' : '+'}{Math.abs(points)} pts
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isNegative ? 'bg-red-400' : 'bg-green-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// WHAT: Main trust score card component
// WHY: Reusable card for displaying user trust across app
export function TrustScoreCard({
  score,
  breakdown,
  className = '',
  showHowItWorks = true,
}: TrustScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trustLevel = getTrustLevel(score);
  const scoreColor = getTrustScoreColor(score);
  const progressColor = getTrustProgressBarColor(score);
  const gradient = getTrustGradient(score);

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className={`rounded-lg border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-br ${gradient} p-6`}>
        <div className="flex items-start justify-between gap-4">
          {/* Score display */}
          <div className="flex-grow">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-5xl font-bold ${scoreColor}`}>{clampedScore}</span>
              <span className="text-gray-600 text-lg font-medium">/100</span>
            </div>

            {/* Trust level badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${trustLevel.bg} ${trustLevel.color}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${trustLevel.color === 'text-green-700' || trustLevel.color === 'text-green-600' ? 'bg-green-600' : trustLevel.color === 'text-amber-600' ? 'bg-amber-500' : trustLevel.color === 'text-blue-600' ? 'bg-blue-500' : 'bg-red-600'}`}
              />
              {trustLevel.label}
            </div>
          </div>

          {/* Score interpretation */}
          <div className="text-right">
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
              Your Score
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${clampedScore}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {clampedScore < 25 && 'At Risk'}
            {clampedScore >= 25 && clampedScore < 45 && 'New'}
            {clampedScore >= 45 && clampedScore < 65 && 'Building'}
            {clampedScore >= 65 && clampedScore < 85 && 'Reliable'}
            {clampedScore >= 85 && 'Trusted'}
          </span>
        </div>
      </div>

      {/* Breakdown section (optional) */}
      {breakdown && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-2 hover:text-brand transition-colors">
              <span className="font-semibold text-gray-900">Score Breakdown</span>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>

            <div className="mt-4 space-y-1">
              <FactorRow
                label="Reviews & Ratings"
                points={breakdown.ratingPoints}
                max={40}
                icon={<span className="text-lg">⭐</span>}
              />
              <FactorRow
                label="Task Completion"
                points={breakdown.completionPoints}
                max={20}
                icon={<span className="text-lg">✓</span>}
              />
              <FactorRow
                label="Verification"
                points={breakdown.verificationPoints}
                max={15}
                icon={<span className="text-lg">✔️</span>}
              />
              <FactorRow
                label="Open Reports"
                points={breakdown.reportPenalty}
                max={20}
                icon={<span className="text-lg">⚠️</span>}
              />
              <FactorRow
                label="Account Tenure"
                points={breakdown.tenurePoints}
                max={10}
                icon={<span className="text-lg">📅</span>}
              />
            </div>
          </details>
        </div>
      )}

      {/* How it works section (optional) */}
      {showHowItWorks && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-brand transition-colors w-full"
          >
            <HelpCircle className="w-4 h-4" />
            How is this calculated?
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                Your trust score is built from <strong>6 independent factors</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs">
                <li>
                  <strong>Reviews (0–40pts):</strong> Weighted average of ratings you've received
                </li>
                <li>
                  <strong>Completion (0–20pts):</strong> Tasks completed vs. accepted + volume bonus
                </li>
                <li>
                  <strong>Verification (0–15pts):</strong> Email, phone, and student ID verification
                </li>
                <li>
                  <strong>Reports (−20pts max):</strong> Penalty for unresolved reports against you
                </li>
                <li>
                  <strong>Tenure (0–10pts):</strong> Account age; 1 point per month (max 10)
                </li>
              </ul>
              <p className="mt-2 pt-2 border-t border-gray-200">
                Higher scores unlock access to premium features and better task matching. Build
                your score by completing tasks consistently, getting verified, and maintaining a
                clean record.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

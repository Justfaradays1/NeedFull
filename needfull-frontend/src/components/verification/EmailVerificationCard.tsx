// WHAT: Email verification card — shows email verification status and resend button
// WHY: Modular card component for verification page, handles email-specific UI and flow

"use client";

import React from "react";
import { Mail, CheckCircle2, RotateCcw } from "lucide-react";

interface EmailVerificationCardProps {
  verified: boolean;
  verifiedAt?: string;
  onResend: () => void | Promise<void>;
  isLoading?: boolean;
}

export function EmailVerificationCard({
  verified,
  verifiedAt,
  onResend,
  isLoading = false,
}: EmailVerificationCardProps) {
  return (
    <div className="rounded-2xl border border-card-border bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-success-bg p-3 rounded-lg">
            <Mail className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Verification</h3>
            <p className="text-sm text-gray-600">+5 points to trust score</p>
          </div>
        </div>
        {verified && (
          <div className="flex items-center gap-2 bg-success-bg px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-success-text" />
            <span className="text-sm font-medium text-success-text">Verified</span>
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="bg-surface-secondary rounded-lg p-4 mb-4">
        {verified ? (
          <div>
            <p className="text-sm text-gray-700">
              ✓ Your email has been verified
            </p>
            {verifiedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Verified on {new Date(verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            Verification pending — check your email for an OTP
          </p>
        )}
      </div>

      {/* Action Button */}
      {!verified && (
        <button
          onClick={onResend}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-success hover:brightness-105 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          {isLoading ? "Sending..." : "Resend Verification Email"}
        </button>
      )}
    </div>
  );
}

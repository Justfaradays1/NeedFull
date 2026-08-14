// WHAT: Student Verification Page — unified hub for email, phone, and student ID verification
// WHY: Central place for users to complete verification and understand trust score impact
// FUTURE: Add verification progress analytics, remind users to verify, add verification badges to profile

"use client";

import React, { useState } from "react";
import { AlertCircle, Shield, TrendingUp } from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import { EmailVerificationCard } from "@/components/verification/EmailVerificationCard";
import { PhoneVerificationCard } from "@/components/verification/PhoneVerificationCard";
import { StudentIDVerificationCard } from "@/components/verification/StudentIDVerificationCard";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { useCelebration } from "@/hooks/useCelebration";

export default function VerificationPage() {
  const {
    status,
    trustBreakdown,
    loading,
    error,
    resendEmailVerification,
    sendPhoneOtp,
    verifyPhoneOtp,
    submitStudentId,
  } = useVerification();

  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [isSubmittingStudentId, setIsSubmittingStudentId] = useState(false);
  const celebration = useCelebration();

  // Handle email resend with loading state
  const handleResendEmail = async () => {
    setIsResendingEmail(true);
    try {
      await resendEmailVerification();
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Handle phone OTP send with loading state
  const handleSendPhoneOtp = async (phoneNumber: string) => {
    setIsSendingPhoneOtp(true);
    try {
      await sendPhoneOtp(phoneNumber);
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Handle phone OTP verify with loading state
  const handleVerifyPhoneOtp = async (otp: string) => {
    setIsVerifyingPhoneOtp(true);
    try {
      await verifyPhoneOtp(otp);
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  // Handle student ID submit with loading state
  const handleSubmitStudentId = async (file: File, matricNumber: string) => {
    setIsSubmittingStudentId(true);
    try {
      const ok = await submitStudentId(file, matricNumber);
      if (ok)
        celebration.showForAction("poster", "student_verified", {
          title: "Student ID Submitted",
          description:
            "Your student ID has been submitted for review. You'll be notified once it's approved. Your trust score will increase when verified.",
          confetti: false,
        });
    } finally {
      setIsSubmittingStudentId(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse text-center">
              <Shield className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-gray-600">Loading verification status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-surface-secondary p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface rounded-lg border border-error-border p-6 text-center">
            <AlertCircle className="w-12 h-12 text-error-text mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load verification status
            </h2>
            <p className="text-gray-600">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-success-text" />
            <h1 className="text-3xl font-bold text-gray-900">
              Student Verification
            </h1>
          </div>
          <p className="text-gray-600">
            Complete verifications to build trust and unlock premium features
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-bg border border-error-border rounded-lg p-4 mb-6">
            <p className="text-sm text-error-text">{error}</p>
          </div>
        )}

        {/* Trust Score Summary */}
        {trustBreakdown && (
          <div className="bg-info-bg rounded-lg border border-success-border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-2">
                  <TrendingUp className="w-5 h-5 text-success-text" />
                  Your Trust Score
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Verification points earned from completed verifications
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-success-text">
                      +5 pts
                    </p>
                    {status.email.verified && (
                      <span className="text-xs text-success-text">✓ Earned</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                    <p className="text-lg font-semibold text-info-text">
                      +4 pts
                    </p>
                    {status.phone.verified && (
                      <span className="text-xs text-info-text">✓ Earned</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Student ID</p>
                    <p className="text-lg font-semibold text-info-text">
                      +6 pts
                    </p>
                    {status.studentId.status === "approved" && (
                      <span className="text-xs text-info-text">✓ Earned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-success-text">
                  {trustBreakdown.verification}
                </p>
                <p className="text-sm text-gray-600">Verification points</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {trustBreakdown.total}
                </p>
                <p className="text-xs text-gray-600">Total trust score</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Cards Grid */}
        <div className="grid gap-6">
          {/* Email Verification */}
          <EmailVerificationCard
            verified={status.email.verified}
            verifiedAt={status.email.verifiedAt}
            onResend={handleResendEmail}
            isLoading={isResendingEmail}
          />

          {/* Phone Verification */}
          <PhoneVerificationCard
            verified={status.phone.verified}
            verifiedAt={status.phone.verifiedAt}
            phone={status.phone.phone}
            onSendOtp={handleSendPhoneOtp}
            onVerifyOtp={handleVerifyPhoneOtp}
            isLoading={isSendingPhoneOtp || isVerifyingPhoneOtp}
          />

          {/* Student ID Verification */}
          <StudentIDVerificationCard
            status={status.studentId.status}
            submittedAt={status.studentId.submittedAt}
            approvedAt={status.studentId.approvedAt}
            rejectionReason={status.studentId.rejectionReason}
            matricNumber={status.studentId.matricNumber}
            documentUrl={status.studentId.documentUrl}
            onSubmit={handleSubmitStudentId}
            isLoading={isSubmittingStudentId}
          />
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-surface rounded-lg border border-card-border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Why Verify?</h3>
          <ul className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="text-success-text font-bold">✓</span>
              <span>Build trust with task posters</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success-text font-bold">✓</span>
              <span>Unlock higher-value tasks</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success-text font-bold">✓</span>
              <span>Get priority in task matching</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success-text font-bold">✓</span>
              <span>Faster wallet withdrawals</span>
            </li>
          </ul>
        </div>
      </div>
      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </div>
  );
}

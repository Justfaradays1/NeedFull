// WHAT: Phone verification card — shows phone verification status and OTP input flow
// WHY: Modular card component for verification page, handles phone-specific UI and SMS OTP flow
// FUTURE: Integrate Termii or AfricasTalking for SMS OTP

"use client";

import React, { useState } from "react";
import { Phone, CheckCircle2, Send, Loader } from "lucide-react";

interface PhoneVerificationCardProps {
  verified: boolean;
  verifiedAt?: string;
  phone?: string;
  onSendOtp: (phoneNumber: string) => void | Promise<void>;
  onVerifyOtp: (otp: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function PhoneVerificationCard({
  verified,
  verifiedAt,
  phone,
  onSendOtp,
  onVerifyOtp,
  isLoading = false,
}: PhoneVerificationCardProps) {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phoneInput.trim()) {
      setError("Please enter your phone number");
      return;
    }

    try {
      setError(null);
      await onSendOtp(phoneInput);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setError(null);
      await onVerifyOtp(otpInput);
      setStep("input");
      setPhoneInput("");
      setOtpInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Phone className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Phone Verification</h3>
            <p className="text-sm text-gray-600">+4 points to trust score</p>
          </div>
        </div>
        {verified && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-medium text-blue-700">Verified</span>
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        {verified ? (
          <div>
            <p className="text-sm text-gray-700">
              ✓ Your phone has been verified
            </p>
            {verifiedAt && phone && (
              <>
                <p className="text-sm text-gray-600 mt-1">{phone}</p>
                <p className="text-xs text-gray-500">
                  Verified on {new Date(verifiedAt).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            Add and verify your phone number via SMS OTP
          </p>
        )}
      </div>

      {/* Input Form */}
      {!verified && (
        <div className="space-y-3">
          {step === "input" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  placeholder="+234 (0)901 234 5678"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send OTP via SMS
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                FUTURE: WhatsApp fallback if SMS unavailable
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  OTP sent to {phoneInput}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep("input");
                    setOtpInput("");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpInput.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

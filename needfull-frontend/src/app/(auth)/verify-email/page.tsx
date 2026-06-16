// WHAT: Email verification page with token-based verification flow
// WHY: Confirm user email after registration, provide feedback and error recovery
// FUTURE: Add resend countdown timer, support QR code scan for mobile verification

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  // WHAT: Get email from localStorage for resend functionality
  // WHY: User may need to resend if token expires or email not received
  const getStoredEmail = () => {
    try {
      const authData = localStorage.getItem("nf-auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.email || "";
      }
    } catch {
      return "";
    }
    return "";
  };

  // WHAT: Verify email on component mount using token from URL
  // WHY: User clicked link from email, verify immediately without user action
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setState("error");
          setErrorMessage("Verification link is invalid or missing the token.");
          return;
        }

        // WHAT: POST token to backend verification endpoint
        // WHY: Backend validates token, marks email as verified, prevents token reuse
        const response = await apiClient.post("/auth/verify-email", { token });

        if (response.status === 200 || response.status === 201) {
          setState("success");
          toast.success("Email verified successfully!");
        }
      } catch (error) {
        setState("error");

        // WHAT: Extract error message from API response
        // WHY: Show user-friendly error instead of generic "Something went wrong"
        if (error instanceof Error) {
          if (error.message.includes("401") || error.message.includes("403")) {
            setErrorMessage(
              "This verification link has expired. Please request a new one.",
            );
          } else if (error.message.includes("already verified")) {
            setErrorMessage(
              "Your email is already verified. You can sign in now.",
            );
          } else {
            setErrorMessage(
              error.message || "Verification failed. Please try again.",
            );
          }
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }

        toast.error("Email verification failed");
      }
    };

    verifyEmail();
  }, [searchParams]);

  // WHAT: Resend verification email to user
  // WHY: Original email may have been delayed, deleted, or link expired
  const handleResend = async () => {
    try {
      setIsResending(true);
      const email = getStoredEmail();

      if (!email) {
        toast.error("Email address not found. Please sign up again.");
        router.push("/register");
        return;
      }

      // WHAT: POST to resend endpoint with user email
      // WHY: Backend generates new OTP/token and sends new verification email
      await apiClient.post("/auth/resend-verification", { email });

      toast.success("Verification email sent! Check your inbox.");
      setIsResending(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      toast.error(message);
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white safe-all">
      {/* WHAT: Header with NeedFull branding */}
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-2xl font-bold text-brand">
            NeedFull
          </h1>
        </Link>
      </div>

      {/* WHAT: Main verification content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md text-center">
          {/* WHAT: Loading state */}
          {state === "loading" && (
            <div className="space-y-6">
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-brand" />
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Verifying your email...
                </h2>
                <p className="mt-2 text-gray-600">
                  Please wait while we confirm your email address.
                </p>
              </div>
            </div>
          )}

          {/* WHAT: Success state */}
          {state === "success" && (
            <div className="space-y-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Email verified!
                </h2>
                <p className="mt-2 text-gray-600">
                  Your account is active. Welcome to NeedFull.
                </p>
              </div>

              {/* WHAT: CTA button to dashboard */}
              <button
                onClick={() => router.push("/feed")}
                className="tap-target w-full rounded-lg bg-gold px-4 py-3 font-semibold text-white transition-colors hover:bg-gold-dark active:bg-gold-dark"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* WHAT: Error state */}
          {state === "error" && (
            <div className="space-y-6">
              <XCircle className="mx-auto h-16 w-16 text-danger" />
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Verification failed
                </h2>
                <p className="mt-2 text-gray-600">{errorMessage}</p>
              </div>

              {/* WHAT: Resend button for error recovery */}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="tap-target w-full rounded-lg border-2 border-brand px-4 py-3 font-semibold text-brand transition-colors hover:bg-brand-light disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </button>

              {/* WHAT: Link back to login */}
              <p className="text-sm text-gray-600">
                Already verified?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-brand hover:text-brand-mid"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WHAT: Bottom safe area spacing */}
      <div className="h-safe-bottom" />
    </div>
  );
}

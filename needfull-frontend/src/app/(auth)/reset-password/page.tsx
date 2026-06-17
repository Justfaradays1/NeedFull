// WHAT: Reset password page (Step 2 of password reset)
// WHY: Allow user to set new password with token validation
// FUTURE: Add password strength meter, add password history check

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/schemas/resetPasswordSchema";

type PageState = "loading" | "form" | "success" | "error";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-white safe-all">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-2xl font-bold text-brand">NeedFull</h1>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
      <div className="h-safe-bottom" />
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // WHAT: Validate token on page mount
  // WHY: Ensure reset token is valid before showing form (prevents invalid submissions)
  useEffect(() => {
    if (!token) {
      setPageState("error");
      setErrorMessage("Reset link is missing or invalid.");
      return;
    }

    // WHAT: If token exists, show form
    // WHY: Backend will validate token on submission
    setPageState("form");
  }, [token]);

  // WHAT: Submit new password with reset token
  // WHY: Backend validates token, hashes new password, prevents token reuse
  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      if (!token) {
        setPageState("error");
        setErrorMessage("Reset token is missing.");
        return;
      }

      // WHAT: POST new password and token to backend
      // WHY: Backend validates token, updates password, invalidates token
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: data.password,
      });

      setPageState("success");
      toast.success("Password updated successfully!");

      // WHAT: Redirect to login after 2 seconds
      // WHY: Give user time to read success message, then prompt to sign in
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setPageState("error");

      // WHAT: Extract error message from API response
      // WHY: Show user-friendly error (expired token, invalid password format, etc.)
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("403")) {
          setErrorMessage(
            "This reset link has expired. Please request a new one.",
          );
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("used")
        ) {
          setErrorMessage("This reset link has already been used.");
        } else {
          setErrorMessage(error.message || "Failed to reset password.");
        }
      } else {
        setErrorMessage("An unexpected error occurred.");
      }

      toast.error("Password reset failed");
    }
  };

  // WHAT: Loading state while validating token
  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-white safe-all">
        {/* WHAT: Header with logo */}
        <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-2xl font-bold text-brand">
              NeedFull
            </h1>
          </Link>
        </div>

        {/* WHAT: Loading spinner */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: Success state - password updated
  if (pageState === "success") {
    return (
      <div className="flex min-h-screen flex-col bg-white safe-all">
        {/* WHAT: Header with logo */}
        <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-2xl font-bold text-brand">
              NeedFull
            </h1>
          </Link>
        </div>

        {/* WHAT: Success message */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md text-center space-y-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Password updated!
              </h2>
              <p className="mt-2 text-gray-600">
                Your password has been successfully changed. Redirecting to sign
                in...
              </p>
            </div>

            {/* WHAT: Manual redirect link */}
            <Link
              href="/login"
              className="tap-target inline-block rounded-lg border-2 border-brand px-6 py-3 font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              Go to Sign In
            </Link>
          </div>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: Error state - invalid/expired token
  if (pageState === "error") {
    return (
      <div className="flex min-h-screen flex-col bg-white safe-all">
        {/* WHAT: Header with logo */}
        <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-2xl font-bold text-brand">
              NeedFull
            </h1>
          </Link>
        </div>

        {/* WHAT: Error message */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md text-center space-y-6">
            <XCircle className="mx-auto h-16 w-16 text-danger" />

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Reset failed
              </h2>
              <p className="mt-2 text-gray-600">{errorMessage}</p>
            </div>

            {/* WHAT: Link to request new reset */}
            <Link
              href="/forgot-password"
              className="tap-target block rounded-lg bg-gold px-4 py-3 font-semibold text-white transition-colors hover:bg-gold-dark"
            >
              Request new reset link
            </Link>

            {/* WHAT: Link back to login */}
            <Link
              href="/login"
              className="tap-target block rounded-lg border-2 border-brand px-4 py-3 font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              Back to Sign In
            </Link>
          </div>
        </div>

        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: Form state - user entering new password
  return (
    <div className="flex min-h-screen flex-col bg-white safe-all">
      {/* WHAT: Header with logo */}
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-2xl font-bold text-brand">
            NeedFull
          </h1>
        </Link>
        <p className="mt-1 text-sm text-gray-600">
          Student task marketplace at FUOYE
        </p>
      </div>

      {/* WHAT: Password form container */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* WHAT: Heading */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Set new password
            </h2>
            <p className="mt-2 text-gray-600">
              Enter a strong password to secure your account.
            </p>
          </div>

          {/* WHAT: Password reset form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* WHAT: New password field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                New password
              </label>
              <div className="relative mt-2">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="tap-target w-full rounded-lg border border-gray-300 bg-white py-3 px-4 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="tap-target absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* WHAT: Confirm password field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Confirm password
              </label>
              <div className="relative mt-2">
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="tap-target w-full rounded-lg border border-gray-300 bg-white py-3 px-4 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="tap-target absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* WHAT: Password requirements info */}
            <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">
                Password requirements:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One number (0-9)</li>
              </ul>
            </div>

            {/* WHAT: Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap-target mt-6 w-full rounded-lg bg-gold px-4 py-3 font-semibold text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>

          {/* WHAT: Footer link */}
          <div className="mt-6 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>
              <Link
                href="/login"
                className="font-semibold text-brand hover:text-brand-mid"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* WHAT: Bottom safe area */}
      <div className="h-safe-bottom" />
    </div>
  );
}

// WHAT: Forgot password page (Step 1 of password reset)
// WHY: Allow users to request password reset via email link
// FUTURE: Add account recovery options (phone number, security questions)

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/schemas/forgotPasswordSchema";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // WHAT: Submit email to backend for password reset
  // WHY: Backend generates reset token and sends email (always succeeds to prevent enumeration)
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // WHAT: POST email to forgot-password endpoint
      // WHY: Backend sends reset link via email, logs attempt for security
      await apiClient.post("/auth/forgot-password", {
        email: data.email,
      });

      // WHAT: Show success state regardless of whether email exists
      // WHY: Prevents attackers from discovering registered email addresses
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success("If that email is registered, check your inbox.");
    } catch (error) {
      // WHAT: Show generic error message
      // WHY: Don't reveal whether email exists
      const message =
        error instanceof Error ? error.message : "Failed to send reset link";
      toast.error(message);
    }
  };

  // WHAT: Success state - user submitted email
  if (submitted) {
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

        {/* WHAT: Success message container */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md text-center space-y-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-gray-600">
                If that email is registered, a reset link is on its way.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Sent to: <strong>{submittedEmail}</strong>
              </p>
            </div>

            {/* WHAT: Instructions */}
            <div className="rounded-lg bg-blue-light px-4 py-3 text-sm text-info">
              💡 The reset link expires in 1 hour. If you don't see the email,
              check your spam folder.
            </div>

            {/* WHAT: Back to login link */}
            <Link
              href="/login"
              className="tap-target inline-block rounded-lg border-2 border-brand px-6 py-3 font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* WHAT: Bottom safe area */}
        <div className="h-safe-bottom" />
      </div>
    );
  }

  // WHAT: Email input form
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

      {/* WHAT: Form container */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* WHAT: Heading and description */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {/* WHAT: Email input form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* WHAT: Email input field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Email address
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="tap-target w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-gray-50"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* WHAT: Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap-target mt-6 w-full rounded-lg bg-gold px-4 py-3 font-semibold text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>

          {/* WHAT: Link back to login */}
          <div className="mt-6 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand hover:text-brand-mid"
              >
                Sign in
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

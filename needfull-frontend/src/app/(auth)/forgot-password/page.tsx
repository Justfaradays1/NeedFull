"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const emailError =
    email && !emailRegex.test(email)
      ? "Please enter a valid email address"
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailError) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          data.message || "Failed to send reset link. Please try again.",
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-gold">
            <svg viewBox="0 3 36 30" fill="none" className="h-5 w-5">
              <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18" />
              <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
              <circle cx="23" cy="9" r="4" fill="currentColor" />
              <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
              <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
              <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
              <circle cx="16" cy="21" r="2.5" fill="currentColor" />
              <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold" style={{ color: "var(--color-foreground, #171717)" }}>NeedFull</span>
        </a>
      </div>

      {success ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <CheckCircle2 className="h-7 w-7 text-success-text" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Check your email</h2>
          <p className="mb-6 text-sm text-gray-500">
            We sent a password reset link to <strong className="text-gray-700">{email}</strong>
          </p>
          <a href="/login" className="text-sm font-semibold text-brand-text hover:underline">
            Back to sign in
          </a>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-foreground, #171717)" }}>
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted, #6b7280)" }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={`block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${
                  emailError ? "border-danger focus:ring-danger/20" : ""
                }`}
                style={{
                  borderColor: emailError ? undefined : "var(--color-card-border, #e5e7eb)",
                  color: "var(--color-foreground, #171717)",
                }}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 flex items-center gap-1 text-sm text-danger" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {emailError}
                </p>
              )}
            </div>
            {error && (
              <p className="flex items-center gap-1 text-sm text-danger" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !!emailError || !email}
              className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <a href="/login" className="font-semibold text-brand-text hover:underline">
              Back to sign in
            </a>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

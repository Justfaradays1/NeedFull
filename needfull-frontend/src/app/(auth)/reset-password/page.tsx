"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type PageState = "loading" | "form" | "success" | "error";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) setPageState("error");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) setPageState("success");
      else setPageState("error");
    } catch {
      setPageState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || pageState === "error") {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Invalid or expired link</h2>
        <p className="mb-6 text-sm text-gray-500">This password reset link is invalid or has expired. Request a new one.</p>
        <a href="/forgot-password" className="inline-block rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid">Request new link</a>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Password reset successful</h2>
        <p className="mb-6 text-sm text-gray-500">Your password has been updated. You can now sign in with your new password.</p>
        <a href="/login" className="inline-block rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid">Sign in</a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-2 text-xl font-bold text-gray-900">Set new password</h2>
      <p className="mb-6 text-sm text-gray-500">Choose a new password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">New password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</label>
          <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <button type="submit" disabled={isSubmitting || password !== confirmPassword} className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid disabled:opacity-50">
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-gray-500">
        <a href="/login" className="font-semibold text-brand hover:underline">Back to sign in</a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-gold">
            <svg viewBox="0 0 36 36" fill="none" className="w-[19px] h-[19px]">
              <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18"/>
              <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28"/>
              <circle cx="23" cy="9" r="4" fill="currentColor"/>
              <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9"/>
              <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9"/>
              <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
              <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
              <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
              <circle cx="16" cy="21" r="2.5" fill="currentColor"/>
              <circle cx="16" cy="21" r="1.5" fill="#1A6B4A"/>
            </svg>
          </div>
          <span className="font-bold text-lg font-display text-gray-900">NeedFull</span>
        </Link>
        <p className="mt-1 text-sm text-gray-500">Student task marketplace at FUOYE</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

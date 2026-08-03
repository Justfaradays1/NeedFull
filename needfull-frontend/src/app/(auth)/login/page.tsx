"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthLayout } from "@/components/auth/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const isLoadingStore = useAuthStore((s) => s.isLoading);
  const errorStore = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [localError, setLocalError] = useState("");
  const [verified, setVerified] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("nf_verified") === "1") {
      setVerified(true);
      sessionStorage.removeItem("nf_verified");
    }
  }, []);

  useEffect(() => {
    const linked = searchParams.get("linked");
    const email = searchParams.get("email");
    if (linked === "google" && email) {
      setLinkedEmail(email);
    }
    const ge = searchParams.get("google_error");
    if (ge) {
      setGoogleError(decodeURIComponent(ge));
    }
    const reason = searchParams.get("reason");
    if (reason === "session_expired") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const linkedEmail = sessionStorage.getItem("google_linked");
    if (linkedEmail) {
      setLinkedEmail(linkedEmail);
      sessionStorage.removeItem("google_linked");
    }
    const storedError = sessionStorage.getItem("google_error");
    if (storedError) {
      setGoogleError(storedError);
      sessionStorage.removeItem("google_error");
    }
  }, []);

  useEffect(() => {
    if (errorStore) {
      setLocalError(errorStore);
      clearError();
    }
  }, [errorStore, clearError]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError("");
    clearError();

    const formData = new FormData(e.currentTarget);

    const loadingToast = toast.loading("Signing in...");
    try {
      await login(
        formData.get("email") as string,
        formData.get("password") as string,
      );
      toast.dismiss(loadingToast);
      toast.success("Welcome back to NeedFull!");
      const user = useAuthStore.getState().user;
      const returnTo = sessionStorage.getItem("nf_return_to");
      if (returnTo) {
        sessionStorage.removeItem("nf_return_to");
        setTimeout(() => router.replace(returnTo), 1200);
      } else {
        const dest = user?.role === "admin" ? "/admin" : "/feed";
        setTimeout(() => router.replace(dest), 1200);
      }
    } catch {
      toast.dismiss(loadingToast);
    }
  }

  return (
    <AuthLayout>
      {/* Logo (mobile-only top bar) */}
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

      {/* Alerts */}
      {sessionExpired && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your session expired. Please log in again to continue.
        </div>
      )}
      {googleError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {googleError}
        </div>
      )}
      {linkedEmail && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Google account linked! Sign in with your email or Google.
        </div>
      )}
      {verified && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Email verified successfully. You can now sign in.
        </div>
      )}

      {/* Heading */}
      <h1 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-foreground, #171717)" }}>
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted, #6b7280)" }}>
        Sign in to continue to NeedFull.
      </p>

      {/* Google */}
      <a
        href="/api/auth/google"
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-150 hover:bg-gray-50 active:scale-[0.98]"
        style={{ borderColor: "var(--color-card-border, #e5e7eb)", color: "var(--color-foreground, #171717)" }}
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </a>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "var(--color-card-border, #e5e7eb)" }} />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-muted, #6b7280)" }}>
            or sign in with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} method="POST" autoComplete="off" className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{
              borderColor: "var(--color-card-border, #e5e7eb)",
              color: "var(--color-foreground, #171717)",
            }}
            placeholder="you@university.edu.ng"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
              Password
            </label>
            <a href="/forgot-password" className="text-xs font-medium text-brand-text hover:underline">
              Forgot password?
            </a>
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            disabled={isLoadingStore}
            autoComplete="current-password"
          />
        </div>
        {localError && (
          <p className="text-sm text-red-600">{localError}</p>
        )}
        <button
          type="submit"
          disabled={isLoadingStore}
          className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
        >
          {isLoadingStore ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <a href="/register" className="font-semibold text-brand-text hover:underline">
          Create one
        </a>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen"
          style={{ backgroundColor: "var(--color-background, #ffffff)" }}
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

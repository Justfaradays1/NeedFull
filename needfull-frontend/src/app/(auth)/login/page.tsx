"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoadingStore = useAuthStore((s) => s.isLoading);
  const errorStore = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [localError, setLocalError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("verified=1")) {
      setVerified(true);
      window.history.replaceState({}, "", "/login");
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

    try {
      await login(
        formData.get("email") as string,
        formData.get("password") as string,
      );
      router.replace("/feed");
    } catch {
      // Error already handled by store — useEffect will display it
    }
  }

  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="w-10 h-10 bg-brand rounded-[10px] flex items-center justify-center text-gold">
            <svg viewBox="0 3 36 30" fill="none" className="w-[26px] h-[26px]">
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
        </a>
        <p className="mt-1 text-sm text-gray-500">Student task marketplace at FUOYE</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-sm">
          {verified && (
            <div className="mb-4 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Email verified successfully. You can now sign in.
            </div>
          )}
          <h2 className="mb-6 text-xl font-bold text-gray-900">Welcome back</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Enter your password" />
            </div>
            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs font-medium text-brand hover:underline">Forgot password?</a>
            </div>
            {localError && <p className="text-sm text-red-600">{localError}</p>}
            <button type="submit" disabled={isLoadingStore} className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] disabled:opacity-50">
              {isLoadingStore ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-500">or continue with</span></div>
          </div>
          <a
            href="/api/auth/google"
            className="inline-flex w-full items-center justify-center gap-3 rounded-[10px] border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-100/50 active:scale-[0.97]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </a>
          <p className="mt-6 text-center text-xs text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-semibold text-brand hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}

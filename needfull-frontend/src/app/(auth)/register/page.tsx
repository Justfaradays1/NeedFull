"use client";

import { useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { Callout } from "@/components/ui/callout";
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterPage() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone") || undefined,
    };

    if (body.password !== form.get("confirmPassword")) {
      setError("Passwords do not match");
      return;
    }

    const loadingToast = toast.loading("Creating your account...");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.dismiss(loadingToast);
        setError(data.message || data.error || "Registration failed");
        setLoading(false);
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Account created! Check your email for the verification code.");
      setEmail(body.email as string);
      setStep("verify");
    } catch {
      toast.dismiss(loadingToast);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const loadingToast = toast.loading("Verifying your email...");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.dismiss(loadingToast);
        setError(data.message || data.error || "Verification failed");
        setLoading(false);
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Email verified! You can now sign in.");
      setTimeout(() => { window.location.href = "/login?verified=1"; }, 1200);
    } catch {
      toast.dismiss(loadingToast);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="w-11 h-11 bg-brand rounded-[12px] flex items-center justify-center text-gold" style={{ boxShadow: 'inset 0 1px 0 rgba(234,163,37,0.3)' }}>
            <svg viewBox="0 3 36 30" fill="none" className="w-[28px] h-[28px]">
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
          <span className="font-bold text-xl font-display text-gray-900">NeedFull</span>
        </a>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {step === "register" ? (
            <>
              <h2 className="mb-3 text-xl font-bold text-gray-900">Create your NeedFull account</h2>
              <Callout variant="tip" className="mb-4">
                Complete your profile after signing up to increase trust and get more opportunities.
              </Callout>
              <form onSubmit={handleRegister} autoComplete="off" className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full name</label>
                  <input id="fullName" name="fullName" type="text" required autoComplete="off" className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                  <input id="email" name="email" type="email" required autoComplete="off" className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="your@university.edu.ng" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Create your password"
                    required
                    minLength={8}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    hint={
                      password ? (
                        <span className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                          {password.length >= 8 ? "\u2713 " : ""}At least 8 characters
                        </span>
                      ) : undefined
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone (optional)</label>
                  <input id="phone" name="phone" type="tel" autoComplete="off" className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="08012345678" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] disabled:opacity-50">
                  {loading ? "Creating account..." : "Create account"}
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
                Already have an account?{' '}
                <a href="/login" className="font-semibold text-brand hover:underline">Sign in</a>
              </p>
            </>
          ) : (
            <form action="/api/auth/verify-email" method="POST" onSubmit={handleVerify} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a 6-digit verification code to <strong className="text-gray-700">{email}</strong>
              </p>
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">Verification code</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="block w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm text-center text-lg font-semibold tracking-[0.5em] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="000000"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] disabled:opacity-50">
                {loading ? "Verifying..." : "Verify email"}
              </button>
              <p className="text-center text-xs text-gray-500">
                Didn&apos;t get it? Check your spam folder or{' '}
                <button type="button" onClick={() => { setStep("register"); setError(""); }} className="font-semibold text-brand hover:underline">try again</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

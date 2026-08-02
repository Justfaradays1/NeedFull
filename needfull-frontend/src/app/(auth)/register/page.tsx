"use client";

import { useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { RoleSelectionStep } from "@/components/auth/RoleSelectionStep";
import { useAuth } from "@/store";
import { post, patch } from "@/lib/apiClient";
import { AuthLayout } from "@/components/auth/AuthLayout";

const REG_STEPS = [
  { id: "register", label: "Account" },
  { id: "role", label: "Role" },
  { id: "verify", label: "Verify" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
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
      const { fullName, email, password, phone } = body as any;
      await registerUser(fullName, email, password, phone);

      toast.dismiss(loadingToast);
      toast.success("Account created! Choose how you want to use NeedFull.");
      setEmail(body.email as string);
      setStep(1);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const detailMsg =
        err?.response?.data?.details
          ?.map((d: { message: string }) => d.message)
          .join(". ") || "";
      setError(
        err?.response?.data?.message ||
          detailMsg ||
          err?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleRoleSelect = useCallback(async (role: "poster" | "both") => {
    setRoleLoading(true);
    try {
      await patch("/user/preferences", { preferred_role: role });
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const handleSkipRole = useCallback(() => {
    setStep(2);
  }, []);

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const loadingToast = toast.loading("Verifying your email...");
    setLoading(true);

    try {
      const data = await post("/auth/verify-email", {
        email,
        otp,
      });

      toast.dismiss(loadingToast);
      toast.success("Email verified! Welcome to NeedFull.");
      setTimeout(() => {
        router.push("/feed");
      }, 1200);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      setError(
        err?.response?.data?.message || err?.message || "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  }

  const renderMobileLogo = () => (
    <div className="mb-6 lg:hidden">
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
  );

  return (
    <AuthLayout>
      {renderMobileLogo()}

      {step === 0 && (
        <>
          <h1 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--color-foreground, #171717)" }}>
            Create your account
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted, #6b7280)" }}>
            Join your campus economy. Start earning or get help with tasks.
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
              <span className="bg-surface px-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-muted, #6b7280)" }}>
                or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} method="POST" autoComplete="off" className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="off"
                className="block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                style={{ borderColor: "var(--color-card-border, #e5e7eb)", color: "var(--color-foreground, #171717)" }}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                className="block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                style={{ borderColor: "var(--color-card-border, #e5e7eb)", color: "var(--color-foreground, #171717)" }}
                placeholder="your@university.edu.ng"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Password
              </label>
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
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Confirm password
              </label>
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
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-foreground, #171717)" }}>
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="off"
                className="block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                style={{ borderColor: "var(--color-card-border, #e5e7eb)", color: "var(--color-foreground, #171717)" }}
                placeholder="08012345678"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-medium text-brand-text hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-brand-text hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-brand-text hover:underline">Sign in</a>
          </p>
        </>
      )}

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Choose your role</h2>
          <RoleSelectionStep
            onSelect={handleRoleSelect}
            onSkip={handleSkipRole}
            loading={roleLoading}
          />
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-900">
            Check your email
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            We sent a 6-digit verification code to{" "}
            <strong className="text-gray-700">{email}</strong>
          </p>
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-gray-700">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg font-semibold tracking-[0.5em] outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify email"}
            </button>
            <p className="text-center text-xs text-gray-500">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => { setStep(0); setError(""); }}
                className="font-semibold text-brand-text hover:underline"
              >
                try again
              </button>
            </p>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

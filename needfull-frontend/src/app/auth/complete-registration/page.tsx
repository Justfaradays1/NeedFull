"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { post } from "@/lib/apiClient";

function CompleteRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem("google_onboarding") || "{}");
      setName(data.name || "");
      setEmail(data.email || "");
      setAvatar(data.avatar || "");
      setRegistrationCode(data.registrationCode || "");
    } catch {
      router.replace("/register");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!registrationCode) {
      setError("Invalid session. Please sign up again.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const loadId = toast.loading("Creating your account...");
    setLoading(true);

    try {
      const res = await post<{
        message: string;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/complete-registration", {
        registrationCode,
        password,
        phone: formData.get("phone") || "",
        department: formData.get("department") || "",
        level: formData.get("level") || "",
      });

      toast.dismiss(loadId);
      sessionStorage.removeItem("google_onboarding");

      localStorage.setItem("nf_access_token", res.tokens.accessToken);
      localStorage.setItem("nf_refresh_token", res.tokens.refreshToken);
      document.cookie = `nf_access_token=${res.tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;

      setShowSuccess(true);
      toast.success("Account created successfully!");
      setTimeout(() => router.replace("/feed"), 2000);
    } catch (err: any) {
      toast.dismiss(loadId);
      const msg = err?.response?.data?.message || err?.message || "Failed to create account";
      setError(msg);

      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid registration")) {
        sessionStorage.removeItem("google_onboarding");
        setTimeout(() => router.replace("/register"), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="auth-page flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
            <svg className="h-8 w-8 text-success-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Account Created</h1>
          <p className="mt-2 text-gray-500">Welcome to NeedFull, {name}!</p>
          <p className="mt-1 text-sm text-gray-400">Redirecting you to your dashboard...</p>
          <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-full animate-pulse rounded-full bg-brand" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            {avatar && (
              <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-brand">
                <img src={avatar} alt="" width={80} height={80} className="h-full w-full object-cover" />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Welcome to NeedFull!</h1>
            <p className="mt-2 text-sm text-gray-500">
              We&apos;ve imported your verified Google information. Let&apos;s complete your account.
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{name || "Loading..."}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-semibold text-success-text">
                Verified
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} method="POST" autoComplete="off" className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Create Password</label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                hint={password ? (
                  <span className={password.length >= 8 ? "text-success-text" : "text-gray-500"}>
                    {password.length >= 8 ? "\u2713 " : ""}At least 8 characters
                  </span>
                ) : undefined}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Repeat your password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="08012345678"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="department" className="text-sm font-medium text-gray-700">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="level" className="text-sm font-medium text-gray-700">Level</label>
              <select
                id="level"
                name="level"
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select your level</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Complete Registration"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-brand-text hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CompleteRegistrationPage() {
  return <CompleteRegistrationForm />;
}

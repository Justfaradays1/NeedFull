"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No verification token found in the link.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setState("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setState("error");
          setMessage(
            data.message || "Verification failed. The link may have expired.",
          );
        }
      })
      .catch(() => {
        setState("error");
        setMessage(
          "Network error. Please check your connection and try again.",
        );
      });
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      {state === "loading" && (
        <p className="text-sm text-gray-500">Verifying your email...</p>
      )}
      {state === "success" && (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Email verified!
          </h2>
          <p className="mb-6 text-sm text-gray-500">{message}</p>
          <a
            href="/login"
            className="inline-block rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid"
          >
            Sign in
          </a>
        </>
      )}
      {state === "error" && (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Verification failed
          </h2>
          <p className="mb-6 text-sm text-gray-500">{message}</p>
          <a
            href="/"
            className="inline-block rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-mid"
          >
            Go home
          </a>
        </>
      )}
    </div>
  );
}

function VerifyLoading() {
  return <div className="text-sm text-gray-500">Loading...</div>;
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
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
        </Link>
      </div>
      <Suspense fallback={<VerifyLoading />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}

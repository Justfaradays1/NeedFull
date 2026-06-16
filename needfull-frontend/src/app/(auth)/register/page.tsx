// WHAT: Registration page (route: /auth/register)
// WHY: Entry point for new user signup
// FUTURE: Add social signup options, add referral code input, add terms acceptance

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useIsAuthenticated, useAuthInit } from "@/store";

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  // WHAT: Redirect to /feed if already logged in
  // WHY: Prevent logged-in users from accessing register page
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/feed");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

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

      {/* WHAT: Main registration form container */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* WHAT: Registration form component */}
          <RegisterForm />

          {/* WHAT: Footer with login link */}
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>
              Already have an account?{" "}
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

      {/* WHAT: Bottom safe area spacing */}
      <div className="h-safe-bottom" />
    </div>
  );
}

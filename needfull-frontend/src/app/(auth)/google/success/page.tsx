"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export const dynamic = "force-dynamic";

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("nf_access_token", accessToken);
  localStorage.setItem("nf_refresh_token", refreshToken);
  document.cookie = `nf_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
}

const ERROR_MESSAGES: Record<string, string> = {
  google_auth_failed: "Something went wrong signing in with Google. Please try again.",
  google_invalid_state: "This sign-in request is invalid. Please try again.",
  google_state_expired: "This sign-in request has expired. Please try again.",
  google_email_not_verified: "Your Google account email could not be verified. Please use a different method.",
  google_not_found: "No NeedFull account was found for this Google account.",
  email_exists: "An account with this email already exists. Try logging in instead.",
};

function GoogleSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const action = searchParams.get("action");
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");
    const email = searchParams.get("email") || "";
    const name = searchParams.get("name") || "";
    const avatar = searchParams.get("avatar") || "";
    const regCode = searchParams.get("registrationCode") || "";

    if (error) {
      const msg = ERROR_MESSAGES[error] || "Something went wrong. Please try again.";
      sessionStorage.setItem("google_error", msg);
      router.replace(`/login?google_error=${encodeURIComponent(msg)}`);
      return;
    }

    if (!action) {
      router.replace("/login?error=google_auth_failed");
      return;
    }

    if (action === "login") {
      if (!accessToken || !refreshToken) {
        router.replace("/login?error=google_auth_failed");
        return;
      }
      storeTokens(accessToken, refreshToken);
      useAuthStore.getState().refreshUser().then(() => {
        const user = useAuthStore.getState().user;
        const dest = user?.role === "admin" ? "/admin" : "/feed";
        router.replace(dest);
      }).catch(() => {
        router.replace("/feed");
      });
      return;
    }

    if (action === "link") {
      sessionStorage.setItem("google_linked", email);
      router.replace("/login");
      return;
    }

    if (action === "complete") {
      if (!regCode) {
        router.replace("/login?error=google_auth_failed");
        return;
      }
      sessionStorage.setItem("google_onboarding", JSON.stringify({ name, email, avatar, registrationCode: regCode }));
      router.replace("/auth/complete-registration");
      return;
    }
  }, [router, searchParams, setUser]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-background, #ffffff)" }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4"
        style={{ backgroundColor: "var(--color-background, #ffffff)" }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-gray-500">Completing sign in...</p>
        </div>
      </div>
    }>
      <GoogleSuccessHandler />
    </Suspense>
  );
}

// WHAT: Google OAuth success handler — extracts tokens from URL, stores them, redirects
// WHY: Backend redirects here after Google login with accessToken + refreshToken in query params

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function GoogleSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/feed");
    } else {
      router.push("/login?error=google_auth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="auth-page flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="text-sm text-gray-500">Completing sign in...</div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={<div className="auth-page flex min-h-screen flex-col items-center justify-center bg-white"><div className="text-sm text-gray-500">Completing sign in...</div></div>}>
      <GoogleSuccessHandler />
    </Suspense>
  );
}

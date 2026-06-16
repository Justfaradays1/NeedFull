// WHAT: Global error boundary
// WHY: Catch rendering errors and show a recoverable UI
// FUTURE: Add error tracking with Sentry

"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("[ErrorBoundary]", error); }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl">⚠️</div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mb-6 text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand/90">
        Try again
      </button>
    </div>
  );
}

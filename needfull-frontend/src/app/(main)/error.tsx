"use client";

import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("(main) layout error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
      <p className="max-w-xs text-center text-xs text-gray-500">
        {error?.message || "An unexpected error occurred"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand"
      >
        Try again
      </button>
    </div>
  );
}

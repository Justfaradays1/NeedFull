// WHAT: Custom 404 page
// WHY: Provides a branded error page for unknown routes
// FUTURE: Add search or navigation suggestions

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-6xl font-bold text-brand">404</div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="mb-6 text-sm text-gray-500">The page you are looking for does not exist or has been moved.</p>
      <Link href="/feed" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand/90">
        Go Home
      </Link>
    </div>
  );
}

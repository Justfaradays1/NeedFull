// WHAT: Feed page (route: /feed) - main app page after login
// WHY: Landing page for authenticated users, placeholder for task feed
// FUTURE: Implement task list, filtering, sorting, infinite scroll, real-time updates via Socket.io

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsAuthenticated, useAuthUser, useLogout, useAuthInit } from '@/store';

export default function FeedPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const logout = useLogout();
  useAuthInit();

  // WHAT: Redirect to login if not authenticated
  // WHY: Protect feed page from unauthenticated access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white safe-all">
      {/* WHAT: Header with user info and logout */}
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand">
              NeedFull
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome, {user?.fullName}
            </p>
          </div>
          <button
            onClick={logout}
            className="tap-target rounded-lg bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/20"
          >
            Logout
          </button>
        </div>
      </div>

      {/* WHAT: Main content area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-gray-900">
            Welcome to NeedFull
          </h2>
          <p className="text-gray-600">
            The student task marketplace at FUOYE. Post tasks, earn money, build
            trust.
          </p>

          {/* WHAT: Quick action buttons */}
          <div className="space-y-2 pt-4">
            <Link
              href="/tasks/create"
              className="tap-target block w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Post a task
            </Link>
            <Link
              href="/tasks"
              className="tap-target block w-full rounded-lg border-2 border-brand px-4 py-3 font-semibold text-brand hover:bg-brand-light"
            >
              Browse tasks
            </Link>
          </div>

          {/* WHAT: Placeholder for feed */}
          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-500">
              Task feed coming soon. Check back soon for available tasks!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

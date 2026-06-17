'use client';

import Link from 'next/link';
import { useIsAuthenticated, useAuthInit } from '@/store';

export default function LoginPage() {
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  return (
    <div className="flex min-h-screen flex-col bg-white safe-all">
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-2xl font-bold text-brand">NeedFull</h1>
        </Link>
        <p className="mt-1 text-sm text-gray-600">Student task marketplace at FUOYE</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <p className="text-gray-600">Login form placeholder</p>
      </div>
    </div>
  );
}

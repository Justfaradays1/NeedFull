'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { useIsAuthenticated, useAuthInit } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col bg-white safe-all">
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

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your account to post tasks or earn money
            </p>
          </div>

          <LoginForm />

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                New to NeedFull?
              </span>
            </div>
          </div>

          <Link
            href="/register"
            className="tap-target block w-full rounded-lg border-2 border-brand px-4 py-3 text-center font-semibold text-brand transition-colors hover:bg-brand-light"
          >
            Create account
          </Link>

          <div className="space-y-2 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-brand hover:underline">
                Terms of Service
              </Link>
            </p>
            <p>
              <Link href="/privacy" className="text-brand hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="h-safe-bottom" />
    </div>
  );
}

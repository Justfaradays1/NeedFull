'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsAuthed(useAuthStore.getState().isAuthenticated);
    const timeout = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  function handleGoBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(isAuthed ? '/feed' : '/');
    }
  }

  function handlePrimary() {
    router.push(isAuthed ? '/feed' : '/');
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-white px-4">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-light/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div
        className={`flex w-full max-w-md flex-col items-center text-center transition-all duration-700 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* 404 illustration */}
        <div className="relative mb-8" aria-hidden="true">
          <div className="animate-float">
            <svg
              viewBox="0 0 200 140"
              fill="none"
              className="w-48 sm:w-56"
              role="img"
              aria-label="404 illustration"
            >
              {/* Large 404 text */}
              <text
                x="100"
                y="70"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[5rem] font-bold leading-none sm:text-[6rem]"
                fill="#1A6B4A"
                fontFamily="Syne, system-ui, sans-serif"
              >
                404
              </text>

              {/* Decorative dots */}
              <circle cx="30" cy="100" r="2.5" fill="#EAA325" opacity="0.3" />
              <circle cx="170" cy="95" r="2" fill="#EAA325" opacity="0.2" />
              <circle cx="155" cy="115" r="1.5" fill="#1A6B4A" opacity="0.15" />
              <circle cx="45" cy="120" r="1.5" fill="#1A6B4A" opacity="0.2" />
              <circle cx="15" cy="60" r="2" fill="#EAA325" opacity="0.15" />
              <circle cx="185" cy="45" r="1.5" fill="#1A6B4A" opacity="0.12" />

              {/* Curved path under 404 */}
              <path
                d="M40 120 Q100 135 160 120"
                stroke="#1A6B4A"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.12"
                fill="none"
              />

              {/* Small map pin / location icon */}
              <g transform="translate(95, 120)" opacity="0.2">
                <path
                  d="M0 0C0 0 5 6 5 8C5 10 3 11 0 11C-3 11 -5 10 -5 8C-5 6 0 0 0 0Z"
                  fill="#1A6B4A"
                />
                <circle cx="0" cy="7" r="1.5" fill="#fff" />
              </g>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-sm text-[15px] leading-relaxed text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist, may have been moved,
          or the link is incorrect.
        </p>

        {/* Buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-[180px]"
            onClick={handlePrimary}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto sm:min-w-[140px]"
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        </div>

        {/* Helpful navigation */}
        <p className="mt-10 text-sm text-gray-400">
          Looking for something?{' '}
          <Link
            href="/tasks"
            className="font-semibold text-brand hover:text-brand-mid transition-colors"
          >
            Browse the Errand Marketplace
          </Link>
        </p>
      </div>
    </div>
  );
}

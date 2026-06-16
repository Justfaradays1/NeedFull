// WHAT: Root page (route: /) - landing/redirect page
// WHY: Route authenticated users to /feed, unauthenticated to /auth/login
// FUTURE: Add marketing landing page for unauthenticated users, add mobile app install CTA

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useAuthInit } from '@/store';

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  // WHAT: Redirect based on auth status
  // WHY: Route to appropriate page (feed for logged in, login for guests)
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useAuthInit } from '@/store';

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return null;
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLoadingStore } from '@/store/loadingStore';

export function NavigationLoader() {
  const pathname = usePathname();
  const prevRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = pathname;

    if (prev !== pathname) {
      useLoadingStore.getState().startNavigation();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        useLoadingStore.getState().endNavigation();
      }, 1500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return null;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useLoadingBarVisible } from '@/store/loadingStore';

const START_PROGRESS = 20;
const SLOW_ZONE = 85;

export function TopLoadingBar() {
  const visible = useLoadingBarVisible();
  const [width, setWidth] = useState(0);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setFading(false);
      setWidth(START_PROGRESS);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setWidth((prev) => {
          if (prev >= SLOW_ZONE) return SLOW_ZONE;
          const remaining = SLOW_ZONE - prev;
          return prev + Math.max(0.5, remaining * 0.03);
        });
      }, 350);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setWidth(100);
      setFading(true);
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          setWidth(0);
          setFading(false);
        }
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (width === 0 && !fading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px]"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="h-full"
        style={{
          width: `${width}%`,
          backgroundColor: '#1A6B4A',
          opacity: fading ? 0 : 1,
          transition: fading
            ? 'width 300ms ease-in, opacity 400ms ease-out'
            : 'width 250ms ease-out',
          boxShadow: '0 0 10px rgba(26, 107, 74, 0.4)',
        }}
      />
    </div>
  );
}

'use client';

import { useInsertionEffect } from 'react';

export default function ThemeInit() {
  useInsertionEffect(() => {
    try {
      const t = localStorage.getItem('nf-theme');
      if (!t) {
        const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        if (prefersDark) {
          document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0a0b');
        }
      } else {
        document.documentElement.setAttribute('data-theme', t);
        if (t === 'dark') {
          document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0a0b');
        }
      }
    } catch {}
  }, []);

  return null;
}

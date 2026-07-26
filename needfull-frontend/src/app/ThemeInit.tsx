'use client';

import { useInsertionEffect } from 'react';

function getStoredTheme(): string | null {
  try {
    const raw = localStorage.getItem('nf_prefs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.theme === 'string') return parsed.theme;
    }
  } catch {}
  return null;
}

export default function ThemeInit() {
  useInsertionEffect(() => {
    try {
      const t = getStoredTheme();
      if (!t || t === 'system') {
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

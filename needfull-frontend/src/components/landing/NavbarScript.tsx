'use client';

import { useInsertionEffect } from 'react';

export default function NavbarScript() {
  useInsertionEffect(() => {
    function q(id: string) { return document.getElementById(id); }

    const toggle = q('theme-toggle') as HTMLButtonElement | null;
    const toggleM = q('theme-toggle-mobile') as HTMLButtonElement | null;
    const menuBtn = q('mobile-menu-btn') as HTMLButtonElement | null;
    const mobileMenu = q('mobile-menu');
    const icons = [
      q('theme-icon-sun'), q('theme-icon-moon'),
      q('m-icon-sun'), q('m-icon-moon'),
    ] as (HTMLElement | null)[];
    const menuIcons = [q('menu-icon-open'), q('menu-icon-close')] as (HTMLElement | null)[];

    function setUI(theme: string) {
      icons.forEach(function (el) {
        if (!el) return;
        el.classList.toggle('hidden', (el.id.indexOf('sun') >= 0) !== (theme === 'light'));
      });
    }

    function toggleTheme() {
      const html = document.documentElement;
      const cur = html.getAttribute('data-theme') || 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('nf-theme', next); } catch { /* noop */ }
      setUI(next);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0a0a0b' : '#1A6B4A');
    }

    if (toggle) toggle.addEventListener('click', toggleTheme);
    if (toggleM) toggleM.addEventListener('click', toggleTheme);

    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function () {
        const closed = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden', !closed);
        menuBtn.setAttribute('aria-expanded', String(closed));
        if (menuIcons[0] && menuIcons[1]) {
          menuIcons[0].classList.toggle('hidden', closed);
          menuIcons[1].classList.toggle('hidden', !closed);
        }
      });
    }

    setUI(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  return null;
}

// WHAT: Server-safe navbar — light, bordered, theme-var driven
// WHY: The landing hero is light now, so the navbar must not be a dark
//      gradient glued to it. All colours come from CSS vars so the landing
//      page works in both light and dark mode.
// NOTE: Interactivity (theme toggle + mobile menu) stays in NavbarScript.
//       Auth-aware buttons live in AuthNavButtons (client).

import Link from "next/link";
import NavbarScript from "./NavbarScript";
import { AuthNavButtons } from "./AuthNavButtons";

const NAV_LINKS = [
  { href: "#discover", label: "Browse tasks" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "For Runners" },
  { href: "#safety", label: "Trust & safety" },
];

export function Navbar() {
  return (
    <>
      <nav
        id="navbar"
        className="sticky top-0 z-50 border-b border-border-subtle bg-background/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="NeedFull home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-gold">
              <svg viewBox="0 3 36 30" fill="none" className="h-6 w-6" aria-hidden="true">
                <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18" />
                <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
                <circle cx="23" cy="9" r="4" fill="currentColor" />
                <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
                <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <circle cx="16" cy="21" r="2.5" fill="currentColor" />
                <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              NeedFull
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              id="theme-toggle"
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <svg
                id="theme-icon-sun"
                className="hidden h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <svg
                id="theme-icon-moon"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>

            <AuthNavButtons />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-menu-btn"
              aria-label="Open menu"
              aria-expanded="false"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <svg
                id="menu-icon-open"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <svg
                id="menu-icon-close"
                className="hidden h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div id="mobile-menu" className="hidden border-t border-border-subtle md:hidden">
          <div className="space-y-1 px-4 pb-6 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <hr className="my-3 border-border-subtle" />
            <div className="flex items-center gap-3 px-3 pb-2">
              <button
                id="theme-toggle-mobile"
                aria-label="Toggle theme"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground"
              >
                <svg
                  id="m-icon-sun"
                  className="hidden h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                <svg
                  id="m-icon-moon"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              </button>
              <div className="flex flex-1 gap-2">
                <AuthNavButtons />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <NavbarScript />
    </>
  );
}
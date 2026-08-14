import type { Metadata } from "next";
import ThemeInit from "./ThemeInit";
import { Providers } from "@/components/layout/Providers";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { NavigationLoader } from "@/components/ui/NavigationLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeedFull - Local Task Marketplace",
  description:
    "The trusted local marketplace. Post tasks, find verified help, earn money — your payment is safe in escrow until the job is done.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeedFull",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// WHAT: Synchronous, inline theme bootstrap — runs before first paint
// WHY: Reads the persisted theme directly from localStorage and applies
//      data-theme + background BEFORE the browser paints, eliminating the
//      light→dark flash (FOUC). Theming must never gate interactivity.
const THEME_BOOTSTRAP = `(function(){
  try {
    var t = null;
    try {
      var raw = localStorage.getItem('nf_prefs');
      if (raw) { var p = JSON.parse(raw); if (p && typeof p.theme === 'string') t = p.theme; }
    } catch (e) {}
    var dark = false;
    if (t === 'dark') dark = true;
    else if (t !== 'light') {
      try { dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
    }
    var r = document.documentElement;
    r.classList.remove('light', 'dark');
    r.classList.add(dark ? 'dark' : 'light');
    r.setAttribute('data-theme', dark ? 'dark' : 'light');
    r.style.backgroundColor = dark ? '#0a0a0b' : '#ffffff';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0a0a0b' : '#1A6B4A');
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
          suppressHydrationWarning
        />
        <meta name="theme-color" content="#1A6B4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="manifest" href="/manifest.json?v=2" />
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
      </head>
      <body className="bg-(--color-background) text-(--color-foreground)">
        <ThemeInit />
        <TopLoadingBar />
        <NavigationLoader />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:inline-flex focus:items-center focus:gap-2 focus:rounded-[10px] focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-on-brand focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <div id="main-content">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

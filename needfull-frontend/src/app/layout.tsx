import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeedFull - Student Task Marketplace',
  description:
    'Post tasks, earn money, build trust. NeedFull is a student-focused marketplace at FUOYE.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeedFull',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1A6B4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: 'try{var t=localStorage.getItem("nf-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);if(t==="dark"){document.querySelector(\'meta[name="theme-color"]\')?.setAttribute("content","#0a0a0b")}}catch(e){}' }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-white text-gray-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:inline-flex focus:items-center focus:gap-2 focus:rounded-[10px] focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none">
          Skip to content
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}

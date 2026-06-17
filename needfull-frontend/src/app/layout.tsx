import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';

const Toaster = dynamic(() => import('react-hot-toast').then(m => m.Toaster), { ssr: false });

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
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1A6B4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-white text-gray-900">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: { background: '#1A6B4A', color: '#ffffff' },
            success: { style: { background: '#10b981' } },
            error: { style: { background: '#E74C3C' }, duration: 5000 },
          }}
        />
        {children}
      </body>
    </html>
  );
}

// WHAT: Protected layout with bottom navigation for main app pages
// WHY: Auth guard prevents unauthenticated access, bottom nav provides primary navigation
// FUTURE: Add real-time unread badge via Socket.io, add deep link handling, add tab transition animations

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store';

const TABS = [
  { href: '/feed', label: 'Home', icon: 'House' },
  { href: '/explore', label: 'Explore', icon: 'Compass' },
  { href: '/post', label: 'Post', icon: 'CirclePlus', isFab: true },
  { href: '/chat', label: 'Chat', icon: 'MessageCircle' },
  { href: '/profile', label: 'Profile', icon: 'User' },
] as const;

// WHAT: Defer heavy icon imports to avoid WASM SWC compilation issues
// WHY: WASM SWC can fail on lucide-react dynamic icon resolution
function TabIcon({ icon, className }: { icon: string; className?: string }) {
  const [Icon, setIcon] = useState<React.ComponentType<{ className?: string }> | null>(null);

  useEffect(() => {
    import('lucide-react').then((mod) => {
      const Icons: Record<string, React.ComponentType<{ className?: string }>> = {
        House: mod.House, Compass: mod.Compass, CirclePlus: mod.CirclePlus,
        MessageCircle: mod.MessageCircle, User: mod.User,
      };
      setIcon(() => Icons[icon]);
    });
  }, [icon]);

  if (!Icon) return <span style={{ width: className?.includes('h-7') ? 28 : 20, height: className?.includes('h-7') ? 28 : 20 }} />;
  return <Icon className={className || 'h-5 w-5'} />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const authed = useAuthStore.getState().isAuthenticated;
    if (!authed) {
      router.push('/login');
      setIsAuthed(false);
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  if (isAuthed === null) return null;
  if (!isAuthed) return null;

  return <>{children}</>;
}

function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    import('@/lib/apiClient').then((mod) => {
      mod.default.get('/notifications/unread-count')
        .then((res) => setCount(res.data?.data?.count ?? 0))
        .catch(() => {});
    });
  }, []);

  return count > 0 ? (
    <span className="absolute -right-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 py-[1px] text-[9px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !pathname.startsWith('/auth');

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <AuthGuard>
        {children}
      </AuthGuard>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 pb-safe-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {TABS.map((tab) => {
              const { href, label, icon } = tab;
              const isFab = 'isFab' in tab && tab.isFab;
              const isActive = pathname === href || pathname.startsWith(href + '/');

              if (isFab) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="tap-target relative -mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-lg shadow-gold/30 transition-all active:scale-90 hover:shadow-xl hover:shadow-gold/40"
                    aria-label={label}
                  >
                    <TabIcon icon={icon} className="h-7 w-7" />
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={`tap-target flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-brand' : 'text-gray-400'
                  }`}
                  aria-label={label}
                >
                  <div className="relative">
                    <TabIcon icon={icon} className={`h-5 w-5 ${isActive ? 'text-brand' : ''}`} />
                    {label === 'Chat' && <UnreadBadge />}
                  </div>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

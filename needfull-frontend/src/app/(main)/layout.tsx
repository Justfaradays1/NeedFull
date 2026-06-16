// WHAT: Protected layout with bottom navigation for main app pages
// WHY: Auth guard prevents unauthenticated access, bottom nav provides primary navigation
// FUTURE: Add real-time unread badge via Socket.io, add deep link handling, add tab transition animations

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  House, Compass, CirclePlus, MessageCircle, User,
} from 'lucide-react';
import { useIsAuthenticated, useAuthInit } from '@/store';
import apiClient from '@/lib/apiClient';

const TABS = [
  { href: '/feed', label: 'Home', Icon: House },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/post', label: 'Post', Icon: CirclePlus, isFab: true },
  { href: '/chat', label: 'Chat', Icon: MessageCircle },
  { href: '/profile', label: 'Profile', Icon: User },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data?.data?.count ?? 0))
      .catch(() => { /* non-blocking */ });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const showNav = !pathname.startsWith('/auth');

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      {children}

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 pb-safe-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {TABS.map((tab) => {
              const { href, label, Icon } = tab;
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
                    <Icon className="h-7 w-7" />
                  </Link>
                );
              }

              const isChat = label === 'Chat';

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
                    <Icon className={`h-5 w-5 ${isActive ? 'text-brand' : ''}`} />
                    {isChat && unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 py-[1px] text-[9px] font-bold leading-none text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
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

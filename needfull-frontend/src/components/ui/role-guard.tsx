'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser, useIsAdmin, useUserRoles } from '@/store';

interface RoleGuardProps {
  roles: string[];
  fallbackHref?: string;
  children: React.ReactNode;
}

export function RoleGuard({ roles, fallbackHref = '/feed', children }: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const userRoles = useUserRoles();

  const hasRole = roles.some((r) => userRoles.includes(r));

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasRole && !isAdmin) {
      router.push(fallbackHref);
    }
  }, [user, hasRole, isAdmin, router, fallbackHref]);

  if (!user) return null;
  if (!hasRole && !isAdmin) return null;

  return <>{children}</>;
}

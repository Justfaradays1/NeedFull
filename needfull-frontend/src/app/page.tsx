'use client';

import { useIsAuthenticated, useAuthInit } from '@/store';

export default function RootPage() {
  const isAuthenticated = useIsAuthenticated();
  useAuthInit();

  return (
    <div className="p-8 text-center">
      <div className="text-xl font-bold text-brand mb-4">NeedFull</div>
      <div className="text-gray-600">Auth: {isAuthenticated ? 'Logged in' : 'Guest'}</div>
    </div>
  );
}

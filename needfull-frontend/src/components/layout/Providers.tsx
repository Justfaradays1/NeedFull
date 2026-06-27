'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        {children}
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ top: 12 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.40)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.10)',
              borderRadius: '16px',
              color: '#111827',
              fontSize: '14px',
              fontWeight: 500,
              maxWidth: '360px',
              padding: '12px 16px',
              isolation: 'isolate',
            },
            success: {
              iconTheme: { primary: '#059669', secondary: '#ecfdf5' },
              style: { borderLeft: '3px solid #059669' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
              style: { borderLeft: '3px solid #dc2626' },
              duration: 4000,
            },
            loading: {
              iconTheme: { primary: '#2563eb', secondary: '#eff6ff' },
              style: { borderLeft: '3px solid #2563eb' },
            },
          }}
        />
      </UserPreferencesProvider>
    </QueryClientProvider>
  );
}

'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A6B4A',
            color: '#ffffff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#E74C3C',
            },
            duration: 5000,
          },
        }}
      />
      {children}
    </>
  );
}

"use client";

import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // If we had React Query or similar providers, they would go here
  return (
    <>
      {children}
    </>
  );
}

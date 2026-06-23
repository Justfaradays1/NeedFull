// WHAT: Hook to initialize auth store on app mount
// WHY: Restores tokens from localStorage, syncs with persist middleware, handles rehydration
// FUTURE: Add automatic token refresh on init, add offline detection

"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

// WHAT: Initialize auth store and restore tokens from localStorage
// WHY: Called once on app mount to sync store with persisted localStorage data
// Must run after client-side hydration
export function useAuthInit() {
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // WHAT: Attempt to restore user profile on mount
  // WHY: localStorage only has tokens and user data from persist, but wallet balance can change
  const initAuth = useCallback(async () => {
    // WHAT: Only refresh if tokens exist (user was previously logged in)
    if (isAuthenticated && typeof window !== "undefined") {
      const hasToken = localStorage.getItem("nf_access_token");
      if (hasToken) {
        try {
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh user on init:", error);
          // WHAT: Silently fail — user will need to log in again if token invalid
        }
      }
    }
  }, [isAuthenticated, refreshUser]);

  // WHAT: Run init once on mount
  useEffect(() => {
    initAuth();
    // WHAT: Empty dependency array ensures this runs only once on mount
  }, [initAuth]);

  return { isInitialized: true };
}



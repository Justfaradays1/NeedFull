// WHAT: Helper hooks for using auth store in components
// WHY: Provides convenient access to common auth operations and state
// FUTURE: Add useProtectedRoute for redirects, add useFetchWithAuth for automatic token refresh

"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

// WHAT: Hook to use entire auth state
// WHY: Most components need access to user, isAuthenticated, error, etc.
export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshUser: state.refreshUser,
    setUser: state.setUser,
    clearError: state.clearError,
  }));
}

// WHAT: Hook to access only user data
// WHY: Minimises re-renders when only user data is needed
export function useAuthUser() {
  return useAuthStore((state) => state.user);
}

// WHAT: Hook to check if user is authenticated
// WHY: Common pattern for conditionally rendering content
export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated);
}

// WHAT: Hook to access auth error message
// WHY: Display error notifications in components
export function useAuthError() {
  return useAuthStore((state) => state.error);
}

// WHAT: Hook to check if auth operation is in progress
// WHY: Show loading spinners during login/register
export function useAuthLoading() {
  return useAuthStore((state) => state.isLoading);
}

// WHAT: Hook for logout with toast notification
// WHY: Provides feedback when user logs out
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = useCallback(() => {
    logout();
    // WHAT: Could dispatch toast here if toast context exists
    console.log("User logged out");
  }, [logout]);

  return handleLogout;
}

// WHAT: Hook to get current user role
// WHY: Check permissions (admin vs student)
export function useUserRole() {
  const user = useAuthStore((state) => state.user);
  return user?.role;
}

// WHAT: Hook to check if user has admin role
// WHY: Gate admin-only features
export function useIsAdmin() {
  const role = useUserRole();
  return role === "admin";
}

// WHAT: Hook to access wallet data
// WHY: Display balance, escrow, etc.
export function useWallet() {
  const user = useAuthStore((state) => state.user);
  return user?.wallet || null;
}

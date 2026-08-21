// WHAT: Auth-aware destination for landing CTAs
// WHY: A logged-in user should land on the real product surface
//      (/tasks/create, /feed), an anonymous visitor on /register — the
//      register page bounces authenticated users to /feed anyway, but
//      skipping the detour keeps the primary action one click.

"use client";

import { useAuthStore } from "@/store/authStore";

export function authDestination(authed: string, anon: string): string {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? authed : anon;
}

export function useAuthDestinations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return {
    isAuthenticated,
    postTask: isAuthenticated ? "/tasks/create" : "/register",
    findRunner: isAuthenticated ? "/feed" : "/register",
    startEarning: isAuthenticated ? "/feed" : "/register",
  };
}
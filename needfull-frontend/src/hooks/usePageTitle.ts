"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/feed": "Home",
  "/explore": "Explore",
  "/post": "Post Task",
  "/chat": "Chat",
  "/profile": "Profile",
  "/wallet": "Wallet",
  "/wallet/fund": "Fund Wallet",
  "/wallet/withdraw": "Withdraw",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/settings/verification": "Verification",
  "/become-runner": "Become a Runner",
};

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function usePageTitle() {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname) return PAGE_TITLES["/feed"];

    const normalized = pathname.replace(/\/+$/, "") || "/";
    if (PAGE_TITLES[normalized]) return PAGE_TITLES[normalized];
    if (normalized.startsWith("/feed/")) return "Task details";
    if (normalized.startsWith("/tasks/create")) return "Post Task";
    if (normalized.startsWith("/tasks/")) return "Task details";
    if (normalized.startsWith("/wallet/fund/card")) return "Pay with Card";
    if (normalized.startsWith("/wallet/fund/manual")) return "Bank Transfer";
    if (normalized.startsWith("/wallet/fund/virtual")) return "Virtual Account";
    if (normalized.startsWith("/wallet/fund")) return "Fund Wallet";
    if (normalized.startsWith("/wallet/withdraw")) return "Withdraw";
    if (normalized.startsWith("/wallet")) return "Wallet";
    if (normalized.startsWith("/settings")) return "Settings";
    if (normalized.startsWith("/profile")) return "Profile";
    if (normalized.startsWith("/chat")) return "Chat";
    if (normalized.startsWith("/explore")) return "Explore";

    const segments = normalized.split("/").filter(Boolean);
    return segments.length > 0
      ? segments
          .map((segment) => capitalize(segment.replace(/[-_]/g, " ")))
          .join(" / ")
      : PAGE_TITLES["/feed"];
  }, [pathname]);
}

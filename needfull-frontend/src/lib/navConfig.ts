// WHAT: Shared role-aware navigation configuration
// WHY: Single source of truth for both desktop sidebar and mobile bottom nav
//      Prevents drift between two independently-maintained nav lists

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  section: "main" | "community" | "account";
  /** Show in the mobile bottom tab bar */
  mobileTab?: boolean;
  /** Render as a prominent CTA button instead of a standard link */
  isCta?: boolean;
  /** Marked as coming-soon / disabled */
  disabled?: boolean;
};

// ─── Poster / Seeker navigation ──────────────────────────────
export const POSTER_NAV: NavItem[] = [
  // Main section
  { href: "/feed", label: "Home", icon: "House", section: "main", mobileTab: true },
  { href: "/explore", label: "Explore", icon: "Compass", section: "main", mobileTab: true },
  { href: "/tasks", label: "Browse Tasks", icon: "ListTodo", section: "main" },
  { href: "/tasks/create", label: "Post", icon: "CirclePlus", section: "main", mobileTab: true, isCta: true },

  // Community section
  { href: "/chat", label: "Chat", icon: "MessageCircle", section: "community", mobileTab: true },
  { href: "/notifications", label: "Notifications", icon: "BellRing", section: "community" },
  { href: "#", label: "Saved", icon: "Bookmark", section: "community", disabled: true },
  { href: "#", label: "My Applications", icon: "ClipboardCheck", section: "community", disabled: true },

  // Account section
  { href: "/profile", label: "Profile", icon: "User", section: "account", mobileTab: true },
  { href: "/wallet", label: "Wallet", icon: "Wallet", section: "account" },
  { href: "/settings", label: "Settings", icon: "Settings", section: "account" },
  { href: "/faq", label: "Help & Support", icon: "HelpCircle", section: "account" },
];

// ─── Runner / Agent navigation ───────────────────────────────
export const RUNNER_NAV: NavItem[] = [
  // Main section
  { href: "/feed", label: "Home", icon: "House", section: "main", mobileTab: true },
  { href: "/hustle", label: "Find Tasks", icon: "ListTodo", section: "main", mobileTab: true },
  { href: "/wallet", label: "Earnings", icon: "Wallet", section: "main", mobileTab: true },

  // Community section
  { href: "/chat", label: "Chat", icon: "MessageCircle", section: "community", mobileTab: true },
  { href: "/notifications", label: "Notifications", icon: "BellRing", section: "community" },

  // Account section
  { href: "/profile", label: "Profile", icon: "User", section: "account", mobileTab: true },
  { href: "/settings", label: "Settings", icon: "Settings", section: "account" },
  { href: "/faq", label: "Help & Support", icon: "HelpCircle", section: "account" },
];

// WHAT: Settings page — notification preferences, app settings, account management
// WHY: Central place for user to manage their account settings
// FUTURE: Add theme toggle, language selection, notification channel preferences

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Shield, ChevronRight, LogOut, User, Lock, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useAuthStore } from "@/store";
import apiClient from "@/lib/apiClient";

export default function SettingsPage() {
  const router = useRouter();
  useAuthInit();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
    } catch { /* best-effort */ }
    logout();
    toast.success("Logged out");
    router.push("/login");
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", href: "/profile" },
        { icon: Shield, label: "Verification", href: "/settings/verification" },
        { icon: Lock, label: "Change Password", href: "/reset-password" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", description: "Push, email, and in-app preferences" },
        { icon: HelpCircle, label: "Help & Support" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100" aria-label="Back">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{section.title}</h2>
            <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
              {section.items.map((item) => (
                <div key={item.label}>
                  {'href' in item ? (
                    <Link href={(item as { href: string }).href} className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                          {'description' in item && <p className="mt-0.5 text-xs text-gray-500">{(item as { description: string }).description}</p>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                          {'description' in item && <p className="mt-0.5 text-xs text-gray-500">{(item as { description: string }).description}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-6">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Account</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>

        {user && (
          <p className="text-center text-xs text-gray-500">
            Logged in as {user.email} &middot; v1.0.0
          </p>
        )}
      </div>
    </div>
  );
}

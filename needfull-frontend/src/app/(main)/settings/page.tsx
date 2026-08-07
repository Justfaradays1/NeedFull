"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  User,
  Lock,
  HelpCircle,
  Wallet,
  Eye,
  Briefcase,
  Volume2,
  Globe,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useAuthStore } from "@/store";
import { get, post, del } from "@/lib/apiClient";
import apiClient from "@/lib/apiClient";
import { ToggleRow } from "@/components/ui/toggle";

export default function SettingsPage() {
  const router = useRouter();
  useAuthInit();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyPromo, setNotifyPromo] = useState(false);

  const [urgentAlert, setUrgentAlert] = useState(true);

  const [showRealName, setShowRealName] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);

  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  useEffect(() => {
    apiClient.get("/auth/me").then((res) => {
      setGoogleLinked(!!res.data.user?.googleId);
    }).catch(() => {});
  }, []);

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const googleWindow = window.open(
        `https://needfull.onrender.com/api/auth/google?action=link`,
        "google-oauth",
        "width=500,height=600"
      );
      if (!googleWindow) {
        toast.error("Popup blocked. Please allow popups for this site.");
        return;
      }
      const timer = setInterval(() => {
        if (googleWindow.closed) {
          clearInterval(timer);
          apiClient.get("/auth/me").then((res) => {
            if (!!res.data.user?.googleId) {
              setGoogleLinked(true);
              toast.success("Google account linked!");
            }
          }).catch(() => {});
        }
      }, 500);
    } catch {
      toast.error("Failed to link Google account");
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      await apiClient.post("/auth/unlink-google");
      setGoogleLinked(false);
      toast.success("Google account unlinked");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to unlink Google account");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /* best-effort */
    }
    logout();
    toast.success("Logged out");
    router.push("/login");
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="bg-surface px-4 py-3 border-b border-card-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-target rounded-lg p-2 hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
            <Settings className="h-5 w-5" />
            Settings
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Account */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Account
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <SettingsLink href="/profile" icon={User} label="Profile" />
            <Divider />
            <SettingsLink
              href="/settings/verification"
              icon={Shield}
              label="Verification"
            />
            <Divider />
            <SettingsLink
              href="/reset-password"
              icon={Lock}
              label="Change Password"
            />
          </div>
        </section>

        {/* Linked Accounts */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Linked Accounts
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Google</span>
              </div>
              {googleLinked === null ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              ) : googleLinked ? (
                <button
                  onClick={handleUnlinkGoogle}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkingGoogle}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-on-brand transition-colors hover:bg-brand-mid disabled:opacity-50"
                >
                  {linkingGoogle ? "Linking..." : "Link"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Notifications
          </h2>
          <div className="space-y-2">
            <ToggleRow
              label="Task alerts"
              enabled={notifyTasks}
              onToggle={() => setNotifyTasks((p) => !p)}
            />
            <ToggleRow
              label="New chat messages"
              enabled={notifyChat}
              onToggle={() => setNotifyChat((p) => !p)}
            />
            <ToggleRow
              label="Payment & escrow updates"
              enabled={notifyPayments}
              onToggle={() => setNotifyPayments((p) => !p)}
            />
            <ToggleRow
              label="Promotional notifications"
              enabled={notifyPromo}
              onToggle={() => setNotifyPromo((p) => !p)}
            />
          </div>
        </section>

        {/* Agent / Runner Settings */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Agent / Runner
          </h2>
          <div className="space-y-2">
            <ToggleRow
              label="Urgent task alert priority"
              enabled={urgentAlert}
              onToggle={() => setUrgentAlert((p) => !p)}
            />
            <SettingsLink
              href="/settings/services"
              icon={Briefcase}
              label="Manage service categories"
            />
          </div>
        </section>

        {/* Privacy & Visibility */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Privacy & Visibility
          </h2>
          <div className="space-y-2">
            <ToggleRow
              label="Show real name publicly"
              enabled={showRealName}
              onToggle={() => setShowRealName((p) => !p)}
            />
            <ToggleRow
              label="Share location for task matching"
              enabled={shareLocation}
              onToggle={() => setShareLocation((p) => !p)}
            />
          </div>
        </section>

        {/* Wallet & Payments */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Wallet & Payments
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <SettingsLink
              href="/wallet"
              icon={Wallet}
              label="Fund wallet, withdraw, manage banks"
            />
          </div>
        </section>

        {/* Help & Support */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Support
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <SettingsLink
              href="/support"
              icon={HelpCircle}
              label="Help & Support"
            />
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
            Account
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </section>

        {user && (
          <p className="text-center text-xs text-gray-500">
            Logged in as {user.email} &middot; v1.0.0
          </p>
        )}
      </div>
    </div>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-gray-100"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}

function Divider() {
  return <div className="mx-4 border-t border-card-border" />;
}

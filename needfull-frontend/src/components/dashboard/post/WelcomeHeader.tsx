"use client";

import Link from "next/link";
import { Bell, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤" };
  if (h < 21) return { text: "Good Evening", emoji: "🌙" };
  return { text: "Good Night", emoji: "🌙" };
}

interface WelcomeHeaderProps {
  firstName: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string | null;
  emailVerified: boolean;
  unreadNotifications: number;
}

export function WelcomeHeader({
  firstName,
  fullName,
  email,
  profilePictureUrl,
  emailVerified,
  unreadNotifications,
}: WelcomeHeaderProps) {
  const greeting = getGreeting();

  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          {greeting.text} <span className="inline-block">{greeting.emoji}</span>
        </h1>
        <p className="-mt-0.5 text-2xl font-black text-gray-900 sm:text-3xl">
          {firstName}
        </p>
        {!emailVerified && (
          <Link
            href="/verify-email"
            className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"
          >
            <CheckCircle className="h-3 w-3" />
            Verify email
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>

        <Link href="/profile">
          <Avatar
            src={profilePictureUrl}
            name={fullName}
            email={email}
            size="md"
          />
        </Link>
      </div>
    </div>
  );
}

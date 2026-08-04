"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤" };
  if (h < 21) return { text: "Good Evening", emoji: "🌙" };
  return { text: "Good Night", emoji: "🌙" };
}

interface WelcomeHeaderProps {
  firstName: string;
  emailVerified: boolean;
}

// WHAT: Greeting block only — notification bell and avatar live in the global
// top bar, so this stays a single clean line on every screen size
export function WelcomeHeader({ firstName, emailVerified }: WelcomeHeaderProps) {
  const greeting = getGreeting();

  return (
    <div className="min-w-0">
      <h1 className="truncate text-lg font-black tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
        {greeting.text}, {firstName}{" "}
        <span className="inline-block">{greeting.emoji}</span>
      </h1>
      <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm dark:text-gray-400">
        Welcome back — your campus, your hustle.
      </p>
      {!emailVerified && (
        <Link
          href="/verify-email"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"
        >
          <CheckCircle className="h-3 w-3" />
          Verify email
        </Link>
      )}
    </div>
  );
}
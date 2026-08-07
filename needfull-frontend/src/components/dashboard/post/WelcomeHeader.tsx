"use client";

import { useGreeting } from "@/hooks/useGreeting";

interface WelcomeHeaderProps {
  firstName: string;
}

// WHAT: Greeting block only — notification bell and avatar live in the global
// top bar, so this stays a single clean line on every screen size
export function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  const greeting = useGreeting();

  return (
    <h1 className="text-scale-section truncate text-gray-900 dark:text-white">
      {greeting.text}, {firstName}{" "}
      <span className="inline-block">{greeting.emoji}</span>
    </h1>
  );
}
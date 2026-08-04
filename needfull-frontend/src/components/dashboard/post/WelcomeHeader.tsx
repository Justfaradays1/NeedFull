"use client";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤" };
  if (h < 21) return { text: "Good Evening", emoji: "🌙" };
  return { text: "Good Night", emoji: "🌙" };
}

interface WelcomeHeaderProps {
  firstName: string;
}

// WHAT: Greeting block only — notification bell and avatar live in the global
// top bar, so this stays a single clean line on every screen size
export function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  const greeting = getGreeting();

  return (
    <h1 className="truncate text-lg font-black tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
      {greeting.text}, {firstName}{" "}
      <span className="inline-block">{greeting.emoji}</span>
    </h1>
  );
}
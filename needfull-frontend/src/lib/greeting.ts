// WHAT: Centralized dashboard greeting — single source of truth for all pages
// WHY: Every screen shows the same welcome, and "Good Night" (a Nigerian
//      bedtime farewell) never appears anywhere in the app.

export interface Greeting {
  text: "Good Morning" | "Good Afternoon" | "Good Evening";
  emoji: string;
}

// 05:00–11:59  Good Morning ☀️
// 12:00–16:59  Good Afternoon 🌤️
// 17:00–23:59  Good Evening 🌙
// Early hours (00:00–04:59) fall back to Good Evening so the platform always
// feels awake and ready for activity rather than saying goodbye.
export function getGreeting(date: Date = new Date()): Greeting {
  const h = date.getHours();
  if (h >= 5 && h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}
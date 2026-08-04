"use client";

// WHAT: Live greeting that always reflects the user's local device time
// WHY: Hour boundaries must roll over automatically, but without polling or
//      re-rendering the tree every minute. One scheduled check just after the
//      next minute boundary does it, and the state reference is kept when the
//      value hasn't changed so React skips the re-render.

import { useEffect, useState } from "react";
import { getGreeting, type Greeting } from "@/lib/greeting";

const MINUTE_MS = 60_000;

export function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(() => getGreeting());

  useEffect(() => {
    let timer: number | undefined;

    const tick = () => {
      const next = getGreeting();
      setGreeting((prev) =>
        prev.text === next.text && prev.emoji === next.emoji ? prev : next,
      );
      const now = new Date();
      const untilBoundary =
        MINUTE_MS - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50;
      timer = window.setTimeout(tick, untilBoundary);
    };

    tick();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return greeting;
}
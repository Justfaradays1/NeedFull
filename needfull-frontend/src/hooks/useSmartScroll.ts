// WHAT: X-style scroll-aware chrome for mobile/tablet
// WHY: On small screens the top bar, bottom nav and FAB should recede when the
//      user scrolls down so content gets the whole screen, then return smoothly
//      when scrolling back up. Desktop (lg+) keeps its chrome always visible.

"use client";

import { useEffect, useRef, useState } from "react";

const HIDE_START = 96; // px of scroll before hiding begins
const HIDE_DELTA = 4; // px per frame that counts as "scrolling down"

export function useSmartScroll() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    // Desktop keeps its sidebar/nav pinned — this interaction is mobile/tablet only.
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;

        if (y <= 8) {
          setHidden(false);
          return;
        }
        if (delta > HIDE_DELTA && y > HIDE_START) {
          setHidden(true);
        } else if (delta < -HIDE_DELTA) {
          setHidden(false);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return { hidden };
}
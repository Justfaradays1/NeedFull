"use client";

import { useState, useEffect } from "react";
import { LifeBuoy, X } from "lucide-react";
import { SupportPanel } from "./SupportPanel";

const SUPPORT_PAGES = [
  "/faq",
  "/faq/",
  "/help",
  "/contact",
  "/support",
  "/guides",
  "/verification",
  "/payment-help",
  "/settings",
];

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const hideOn = ["/login", "/register", "/tasks/create"];
    setVisible(!hideOn.some((p) => path.startsWith(p)));
  }, []);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-lifted transition-all duration-200 hover:bg-brand-mid hover:shadow-lg active:scale-95"
        aria-label="Open support menu"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <LifeBuoy className="h-5 w-5 animate-[gentle-bounce_2s_ease-in-out_infinite]" />
            <span className="hidden sm:inline">Support</span>
          </>
        )}
      </button>
      {open && <SupportPanel onClose={() => setOpen(false)} />}
    </>
  );
}

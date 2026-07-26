"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CommandItem {
  label: string;
  description: string;
  href: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  { label: "Search tasks", description: "Find open tasks across campus", href: "/tasks" },
  { label: "Go to wallet", description: "View your balance and transactions", href: "/wallet" },
  { label: "Create a task", description: "Post a new task for students to do", href: "/tasks/create" },
  { label: "View profile", description: "Open your personal profile", href: "/profile" },
  { label: "Open messages", description: "Jump to chat conversations", href: "/chat" },
  { label: "Notifications", description: "See your latest updates", href: "/notifications" },
  { label: "Explore campus gigs", description: "Browse discovery and opportunities", href: "/explore" },
  { label: "Open settings", description: "Adjust preferences and account settings", href: "/settings" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower),
    );
  }, [query]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      router.push(item.href);
      onClose();
    },
    [router, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1,
          );
          break;
        case "Enter": {
          event.preventDefault();
          const item = filteredItems[highlightedIndex];
          if (item) handleSelect(item);
          break;
        }
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open, filteredItems, highlightedIndex, handleSelect, onClose]);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resultsRef.current) return;
    const highlighted = resultsRef.current.querySelector<HTMLElement>(
      '[data-highlighted="true"]',
    );
    highlighted?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ background: "rgba(0,0,0,0.60)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--cp-bg)",
          border: "1px solid var(--cp-border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.60), 0 8px 24px rgba(0,0,0,0.40)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--cp-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--cp-item-sub)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--cp-item-text)" }}>
                Command palette
              </p>
              <p className="text-xs" style={{ color: "var(--cp-item-sub)" }}>
                Quickly navigate or run search actions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-100 shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--cp-item-sub)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "var(--cp-item-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "var(--cp-item-sub)";
            }}
            aria-label="Close command palette"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--cp-border)" }}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--cp-item-sub)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search commands, pages, or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: "var(--cp-item-text)",
              caretColor: "#1A6B4A",
            }}
          />
          <kbd
            className="hidden sm:flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "var(--cp-item-sub)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            ESC
          </kbd>
        </div>

        <div
          ref={resultsRef}
          className="py-2 palette-scroll"
          style={{
            maxHeight: "360px",
            overflowY: "auto",
          }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <button
                key={item.href}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                data-highlighted={highlightedIndex === index}
                className="w-full text-left px-3 py-1.5 mx-1 rounded-xl flex items-center justify-between gap-3 transition-all duration-100 group"
                style={{
                  width: "calc(100% - 8px)",
                  background:
                    highlightedIndex === index
                      ? "var(--cp-item-hover)"
                      : "var(--cp-item-bg)",
                  border:
                    highlightedIndex === index
                      ? "1px solid var(--cp-border)"
                      : "1px solid transparent",
                  marginBottom: "2px",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      background:
                        highlightedIndex === index
                          ? "rgba(26, 107, 74, 0.25)"
                          : "var(--cp-item-bg)",
                    }}
                  >
                    <svg
                      width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        color:
                          highlightedIndex === index
                            ? "#4ade80"
                            : "var(--cp-item-sub)",
                      }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--cp-item-text)" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--cp-item-sub)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    opacity: highlightedIndex === index ? 1 : 0,
                    color: "#1A6B4A",
                    transition: "opacity 0.1s",
                  }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: "var(--cp-item-sub)" }}>
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>

        <div
          className="hidden sm:flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: "var(--cp-border)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--cp-item-sub)" }}
            >
              <kbd
                className="rounded px-1 py-0.5 text-[9px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                ↑↓
              </kbd>
              {" "}to navigate
            </span>
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--cp-item-sub)" }}
            >
              <kbd
                className="rounded px-1 py-0.5 text-[9px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                ↵
              </kbd>
              {" "}to select
            </span>
          </div>
          <span
            className="text-[10px]"
            style={{ color: "var(--cp-item-sub)" }}
          >
            Press{" "}
            <kbd
              className="rounded px-1 py-0.5 text-[9px]"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              ESC
            </kbd>{" "}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}

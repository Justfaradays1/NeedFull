// WHAT: Viewport-aware floating menu (dropdown) with adaptive positioning
// WHY: Menus must never render outside the visible window. SmartMenu measures
//      the trigger and viewport before each open, opens upward when there is
//      room (flipping downward otherwise), clamps to all four edges, caps its
//      height to the available space (internal scroll when exceeded), and
//      repositions on resize/scroll so the connection to the trigger survives.

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const EDGE_MARGIN = 8; // min px from each viewport edge
const DEFAULT_GAP = 8; // px between anchor and menu
const MAX_VIEWPORT_RATIO = 0.72; // menu never taller than ~72% of the viewport

type Direction = "up" | "down";

type Position = {
  direction: Direction;
  top?: number;
  left?: number;
  right?: number;
  maxHeight: number;
};

export function SmartMenu({
  open,
  onClose,
  anchorRef,
  align = "left",
  className = "",
  ariaLabel,
  caretLeft,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<Element | null>;
  align?: "left" | "right";
  className?: string;
  ariaLabel: string;
  /** px from the menu's left edge where a small pointer caret sits; when set, a caret pointing at the anchor is rendered */
  caretLeft?: number;
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<Position | null>(null);

  // WHAT: Re-measure the anchor + viewport and compute a fully-visible position.
  // WHY: Direction flips when the space above runs out; the menu is fixed so it
  //      is never clipped by ancestor containers and always stays in view.
  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = menu.offsetWidth;
    const naturalHeight = menu.offsetHeight;

    const lowEdge = DEFAULT_GAP + EDGE_MARGIN;
    const spaceAbove = Math.max(0, a.top - lowEdge);
    const spaceBelow = Math.max(0, vh - a.bottom - lowEdge);

    const direction: Direction =
      spaceAbove >= spaceBelow && spaceAbove > 0 ? "up" : "down";
    const available = Math.max(spaceAbove, spaceBelow);
    const maxHeight = Math.min(MAX_VIEWPORT_RATIO * vh, available);
    const height = Math.min(naturalHeight, maxHeight);

    let top: number | undefined;
    if (direction === "up") {
      top = Math.max(EDGE_MARGIN, a.top - DEFAULT_GAP - height);
    } else {
      top = a.bottom + DEFAULT_GAP;
    }
    // Clamp vertically so bottom never escapes the window even after flipping.
    top = Math.min(top, vh - EDGE_MARGIN - height);

    let left: number | undefined;
    let right: number | undefined;
    if (align === "right") {
      right = clamp(vw - a.right, EDGE_MARGIN, vw - width - EDGE_MARGIN);
    } else {
      left = clamp(a.left, EDGE_MARGIN, vw - width - EDGE_MARGIN);
    }

    const next: Position = { direction, top, left, right, maxHeight };
    setPos((prev) =>
      prev &&
      prev.direction === next.direction &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.right === next.right &&
      prev.maxHeight === next.maxHeight
        ? prev
        : next
    );
  }, [anchorRef, align]);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onViewport = () => reposition();
    // Capture phase so ANY scroller (page or nested) re-pins the menu to its anchor.
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        anchorRef.current &&
        !anchorRef.current.contains(t)
      ) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const origin = pos?.direction === "up" ? "origin-bottom" : "origin-top";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={`fixed z-50 w-64 overflow-hidden rounded-2xl border border-card-border bg-surface shadow-lifted animate-[fade-in_0.15s_ease-out] ${origin} ${className}`}
      style={{
        top: pos?.top,
        left: pos?.left,
        right: pos?.right,
        maxHeight: pos?.maxHeight,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {caretLeft !== undefined && (
        <span
          aria-hidden
          className={`pointer-events-none absolute ${
            pos?.direction === "up"
              ? "bottom-[-7px] border-b border-r"
              : "top-[-7px] border-t border-l"
          } h-2.5 w-2.5 rotate-45 rounded-[2px] border-card-border bg-surface`}
          style={{ left: caretLeft }}
        />
      )}
      <div className="h-full max-h-full overflow-y-auto sidebar-scroll p-1.5">
        {children}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
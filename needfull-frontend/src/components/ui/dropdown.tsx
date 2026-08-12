"use client";

import { useEffect, useRef, useState } from "react";
import { SmartMenu } from "@/components/ui/SmartMenu";

interface DropdownItem {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  render?: () => React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  align?: "left" | "right";
  children?: React.ReactNode;
  className?: string;
  onItemClick?: (item: DropdownItem) => void;
}

export function Dropdown({
  items,
  align = "right",
  children,
  className = "",
  onItemClick,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setOpen((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((p) => !p);
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {children}
      </div>
      {open && (
        <SmartMenu
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={triggerRef}
          align={align}
          ariaLabel="Menu"
          className="w-64"
        >
          {items.map((item) => {
            if (item.render) return <div key={item.key}>{item.render()}</div>;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onClick?.();
                  onItemClick?.(item);
                }}
                className={`tap-target flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
                  ${
                    item.variant === "danger"
                      ? "text-error hover:bg-error-light"
                      : item.disabled
                        ? "cursor-not-allowed text-gray-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  }`}
              >
                {item.icon && (
                  <span
                    className={`${item.variant === "danger" ? "text-error" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </SmartMenu>
      )}
    </div>
  );
}
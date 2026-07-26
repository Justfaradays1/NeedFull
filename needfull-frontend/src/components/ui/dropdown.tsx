"use client";

import { useEffect, useRef, useState } from "react";

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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-50 mt-2 min-w-50 overflow-hidden rounded-xl py-1 profile-dropdown ${align === "right" ? "right-0" : "left-0"}`}
            role="menu"
            style={{
              zIndex: 9999,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.10)",
            }}
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
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {item.icon && (
                    <span
                      className={`${item.variant === "danger" ? "text-error" : "text-gray-400"}`}
                    >
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

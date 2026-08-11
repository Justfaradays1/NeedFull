"use client";

// WHAT: Single renderer for category icons across all of NeedFull.
// WHY:  Category icons are canonical lucide icons (never emoji). The config
//       stores the icon NAME + a colour var; this maps name → lucide
//       component so every surface renders the identical icon at any weight.
// NOTE: Static named imports only — keeps the bundle small and avoids
//       dynamic lucide resolution issues on WASM/SWC builds.

import {
  Camera,
  GraduationCap,
  Home,
  Laptop,
  Package,
  Palette,
  Printer,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// WHAT: Category key → lucide icon. Add new categories here AND in
//       lib/categoryConfig.ts (icon name must match a key in this map).
const ICON_MAP: Record<string, LucideIcon> = {
  Shirt,
  Truck,
  Home,
  Printer,
  ShoppingBasket,
  ShoppingCart,
  Laptop,
  Palette,
  Camera,
  Wrench,
  Package,
  GraduationCap,
  Sparkles,
};

export function CategoryIcon({
  name,
  className,
  strokeWidth = 2.25,
  style,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={strokeWidth} style={style} aria-hidden />;
}
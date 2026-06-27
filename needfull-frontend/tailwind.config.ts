// WHAT: Tailwind CSS configuration with NeedFull brand colors and typography
// WHY: Centralises design tokens, ensures consistency across UI, supports theme-aware development
// FUTURE: Add dark mode support, add dynamic color generation for different states, add animation presets

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // WHAT: Custom brand color palette for NeedFull
      // WHY: Primary green (#1A6B4A) for main brand, gold (#EAA325) for CTAs and urgency
      colors: {
        brand: {
          DEFAULT: "#1A6B4A",
          light: "#E6F5EE",
          dark: "#0D4F35",
          mid: "#2D9E6B",
        },
        gold: {
          DEFAULT: "#EAA325",
          light: "#FFF4DF",
          dark: "#9A5C00",
        },
        danger: {
          DEFAULT: "#E74C3C",
          light: "#FDECEA",
        },
        info: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
        },
      },

      // WHAT: Custom font families for typography hierarchy
      // WHY: Syne for bold headlines, Plus Jakarta Sans for body text
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },

      // WHAT: Custom spacing and utilities
      spacing: {
        nav: "80px",
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },

      // WHAT: Animation definitions for interactive states
      // WHY: Skeleton loading animation for perceived performance
      animation: {
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

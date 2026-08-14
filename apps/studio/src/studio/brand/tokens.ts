// WHAT: NeedFull brand tokens for the Studio — single source of truth for
//       every rendered frame. Mirrors the production brand system.

export const palette = {
  green: "#1A6B4A",
  greenDark: "#125038",
  greenLight: "#2E8B62",
  greenSoft: "#E4F0EA",
  gold: "#EAA325",
  goldDark: "#C9871B",
  goldSoft: "#FBF1DC",

  ink: "#0C1210",
  inkSoft: "#131C18",
  inkCard: "#182420",

  surface: "#F6F8F6",
  surfaceAlt: "#EDF1EE",
  card: "#FFFFFF",
  cardAlt: "#F9FBF9",

  text: "#18231E",
  textMuted: "#5C6B63",
  textFaint: "#8C9992",

  line: "#DCE3DF",
  lineStrong: "#C4CEC8",

  success: "#1A6B4A",
  successSoft: "#E4F0EA",
  warning: "#EAA325",
  warningSoft: "#FBF1DC",
  error: "#C0392B",
  errorSoft: "#F9E4E1",

  white: "#FFFFFF",
} as const;

export type Ratio = "16:9" | "9:16" | "1:1";

export const ratioSize: Record<Ratio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};

export const fonts = {
  // System stack only — Studio must render without network font fetches
  display:
    "-apple-system, 'Segoe UI', 'SF Pro Display', Roboto, 'Helvetica Neue', Arial, sans-serif",
  body:
    "-apple-system, 'Segoe UI', 'SF Pro Text', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const shadows = {
  card: "0 12px 40px rgba(12, 18, 16, 0.10), 0 2px 8px rgba(12, 18, 16, 0.06)",
  lifted: "0 24px 64px rgba(12, 18, 16, 0.16), 0 4px 16px rgba(12, 18, 16, 0.08)",
  glow: `0 0 48px rgba(234, 163, 37, 0.35), 0 8px 32px rgba(18, 80, 56, 0.25)`,
} as const;

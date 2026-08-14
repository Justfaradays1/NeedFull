import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeedFull Studio",
  description: "Animated marketing stories for NeedFull — the campus economy platform.",
};

// The dashboard hosts Remotion's Player which must not be server-prerendered.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
// WHAT: Layout for auth routes (/auth/*)
// WHY: Wraps all auth pages with consistent styling, prevents auth actions when already logged in
// FUTURE: Add animated background, add breadcrumb navigation, add help support widget

'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      {/* WHAT: Background gradient decoration (subtle, mobile-optimised) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-brand-light/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-gold/10 blur-3xl" />
      </div>

      {/* WHAT: Auth content */}
      {children}
    </div>
  );
}

// WHAT: Reusable stat card — one semantic surface for quick-fact tiles
// WHY:  Stats are supporting information: subtle surface, muted micro-label,
//       high-contrast value, semantic icon. Works in both themes.

export function StatCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border-default bg-surface-primary p-3 ${className}`}>
      <div className="flex items-center gap-1 text-foreground-muted">{icon}</div>
      <p className="mt-1.5 truncate text-sm font-black text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
    </div>
  );
}
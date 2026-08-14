// WHAT: Canonical task-status badge — one semantic treatment for every task
//       lifecycle state, in BOTH themes.
// WHY:  Raw pastel badges (bg-green-100 etc.) are static light values that
//       look fine in light mode but wash out / glare in dark mode. This badge
//       is built on the semantic feedback token pairs (bg/border/text) and is
//       the single component all task surfaces render.

type Variant = "open" | "in_progress" | "awaiting_confirmation" | "awaiting_funding" | "completed" | "cancelled" | "urgent";

const VARIANTS: Record<Variant, { bg: string; border: string; text: string; label: string }> = {
  open: {
    bg: "bg-success-bg",
    border: "border-success-border",
    text: "text-success-text",
    label: "Open",
  },
  in_progress: {
    bg: "bg-warning-bg",
    border: "border-warning-border",
    text: "text-warning-text",
    label: "In Progress",
  },
  awaiting_confirmation: {
    bg: "bg-info-bg",
    border: "border-info-border",
    text: "text-info-text",
    label: "Awaiting Confirmation",
  },
  awaiting_funding: {
    bg: "bg-warning-bg",
    border: "border-warning-border",
    text: "text-warning-text",
    label: "Awaiting Funding",
  },
  completed: {
    bg: "bg-info-bg",
    border: "border-info-border",
    text: "text-info-text",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-surface-secondary",
    border: "border-border-default",
    text: "text-foreground-muted",
    label: "Cancelled",
  },
  urgent: {
    bg: "bg-error-bg",
    border: "border-error-border",
    text: "text-error-text",
    label: "URGENT",
  },
};

export function TaskStatusBadge({
  status,
  runnerDoneAt,
  urgent = false,
  className = "",
}: {
  status: string;
  runnerDoneAt?: string | null;
  urgent?: boolean;
  className?: string;
}) {
  if (urgent && status === "open") {
    const v = VARIANTS.urgent;
    return <Badge v={v} className={className} />;
  }
  const key: Variant =
    status === "in_progress" && runnerDoneAt
      ? "awaiting_confirmation"
      : (status as Variant) in VARIANTS
        ? (status as Variant)
        : "open";
  return <Badge v={VARIANTS[key]} className={className} />;
}

function Badge({
  v,
  className = "",
}: {
  v: { bg: string; border: string; text: string; label: string };
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold leading-none tracking-wide ${v.bg} ${v.border} ${v.text} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {v.label}
    </span>
  );
}
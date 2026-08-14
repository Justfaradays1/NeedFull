// WHAT: Canonical task work-mode badge (On-site / Remote)
// WHY:  Same semantic badge tokens as TaskStatusBadge so the badges row reads
//       as one family in both themes.

import { MapPin, Wifi } from "lucide-react";

export function WorkModeBadge({ mode }: { mode?: "on_site" | "remote" | null }) {
  if (mode === "remote") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-info-border bg-info-bg px-3 py-1 text-[11px] font-extrabold leading-none text-info-text">
        <Wifi className="h-3 w-3" strokeWidth={2.5} />
        Remote
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-3 py-1 text-[11px] font-extrabold leading-none text-success-text">
      <MapPin className="h-3 w-3" strokeWidth={2.5} />
      On-site
    </span>
  );
}
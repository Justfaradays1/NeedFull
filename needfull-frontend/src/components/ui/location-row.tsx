// WHAT: Canonical location row — the ONE location treatment across NeedFull
// WHY:  A red MapPin is the location language users learn ("red pin = where").
//       This component renders the icon + optional micro-label + value so the
//       accent stays vivid in both themes (never grayed out).

import { MapPin } from "lucide-react";

export function LocationRow({
  label,
  location,
  distance,
  className = "",
}: {
  label?: string;
  location: string;
  distance?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <p className="nf-section-label">{label}</p>}
      <div className="mt-1 flex items-start gap-2">
        <MapPin
          className="mt-0.5 h-4 w-4 shrink-0 text-location"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-foreground-secondary">
          {location}
          {distance ? (
            <span className="ml-1 text-xs font-medium text-foreground-muted">
              ({distance})
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
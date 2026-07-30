"use client";

import { MapPin, Crosshair, Loader2 } from "lucide-react";

interface LocationCardProps {
  type: "task" | "completion";
  label: string;
  value: string;
  onChange: (value: string) => void;
  lat?: number | null;
  lng?: number | null;
  onDetect?: () => void;
  locating?: boolean;
  geoError?: string | null;
  placeholder?: string;
}

export function LocationCard({
  type,
  label,
  value,
  onChange,
  lat,
  lng,
  onDetect,
  locating,
  geoError,
  placeholder,
}: LocationCardProps) {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 focus-within:border-brand">
      <div className="mb-2 flex items-center gap-2">
        <MapPin
          className={`h-4 w-4 ${
            value ? "text-brand" : "text-gray-400"
          }`}
        />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {type === "task" ? "Task Location" : "Completion Location"}
        </span>
      </div>

      <p className="mb-1 text-xs text-gray-400">
        {type === "task"
          ? "Where should the NeedRunner begin this task?"
          : "Where should the completed task be delivered?"}
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `e.g. Block D Hostel, FUOYE`}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-brand"
        />
        {onDetect && (
          <button
            type="button"
            onClick={onDetect}
            disabled={locating}
            className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">{value}</p>
        </div>
      )}

      {lat !== null && lng !== null && (
        <p className="mt-1 text-xs text-brand">Coordinates detected</p>
      )}

      {geoError && (
        <p className="mt-1 text-xs text-red-500">{geoError}</p>
      )}
    </div>
  );
}

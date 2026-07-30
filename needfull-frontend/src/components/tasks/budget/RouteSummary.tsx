"use client";

import { MapPin, ArrowDown } from "lucide-react";

interface RouteSummaryProps {
  taskLocation: string;
  completionLocation: string;
}

export function RouteSummary({
  taskLocation,
  completionLocation,
}: RouteSummaryProps) {
  if (!taskLocation && !completionLocation) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        Task Flow
      </p>

      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <div>
            {taskLocation ? (
              <p className="text-sm font-medium text-gray-800">{taskLocation}</p>
            ) : (
              <p className="text-sm italic text-gray-400">Start location not set</p>
            )}
            <p className="text-[11px] text-gray-400">Start</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-1">
          <ArrowDown className="h-4 w-4 text-gray-300" />
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            {completionLocation ? (
              <p className="text-sm font-medium text-gray-800">
                {completionLocation}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">Finish location not set</p>
            )}
            <p className="text-[11px] text-gray-400">Finish</p>
          </div>
        </div>
      </div>
    </div>
  );
}

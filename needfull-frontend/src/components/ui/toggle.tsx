'use client';

import { ToggleLeft, ToggleRight } from 'lucide-react';

interface ToggleRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

export function ToggleRow({ label, enabled, onToggle, disabled, disabledHint }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div>
        <span className={`text-sm font-semibold ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
        {disabled && disabledHint && <p className="text-[10px] text-gray-500">{disabledHint}</p>}
      </div>
      <button type="button" onClick={onToggle} disabled={disabled} className="tap-target text-brand disabled:text-gray-300">
        {enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
      </button>
    </div>
  );
}

'use client';

import { ShieldCheck, Clock, User } from 'lucide-react';

interface EscrowStatusCardProps {
  budgetNaira: number;
  posterName: string;
  runnerName?: string | null;
  status: string;
}

export function EscrowStatusCard({
  budgetNaira,
  posterName,
  runnerName,
  status,
}: EscrowStatusCardProps) {
  if (status !== 'in_progress') return null;

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-light p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-text" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
          Funds in Escrow
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Budget locked</span>
          <span className="font-semibold text-gray-900">₦{budgetNaira.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-600">
            <span className="font-medium text-gray-800">{posterName}</span> posted
          </span>
        </div>

        {runnerName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-600">
              <span className="font-medium text-gray-800">{runnerName}</span> working
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-500">Funds held securely until task is completed</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-brand/10 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-brand-dark">
          Payment is released to the runner only after you confirm completion. You can
          dispute within 48 hours of marking complete.
        </p>
      </div>
    </div>
  );
}

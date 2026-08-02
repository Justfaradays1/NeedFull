'use client';

import { useState } from 'react';
import { UserCheck, Briefcase, Info } from 'lucide-react';

interface RoleSelectionStepProps {
  onSelect: (role: 'poster' | 'both') => void;
  onSkip: () => void;
  loading?: boolean;
}

export function RoleSelectionStep({ onSelect, onSkip, loading }: RoleSelectionStepProps) {
  const [selected, setSelected] = useState<'poster' | 'both'>('poster');

  const roles = [
    {
      value: 'poster' as const,
      icon: UserCheck,
      title: 'Post tasks',
      description: 'Hire campus students for errands, deliveries, assignments & more',
      badge: 'Free forever',
    },
    {
      value: 'both' as const,
      icon: Briefcase,
      title: 'Post & earn',
      description: 'Also apply for tasks and earn money in your free time',
      badge: 'Admin approval',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Choose your path</h2>
        <p className="mt-1 text-sm text-gray-500">
          You can always change this later in your profile settings.
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                isSelected
                  ? 'border-brand bg-brand-light/20 shadow-sm'
                  : 'border-gray-200 bg-surface hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-brand text-on-brand' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-brand-text' : 'text-gray-900'
                      }`}
                    >
                      {role.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        role.value === 'both'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {role.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{role.description}</p>
                </div>
                <div
                  className={`mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-brand bg-brand' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected === 'both' && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">
            You will need to complete your profile and get approved by an admin before you
            can start applying for tasks.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="flex-1 rounded-[10px] border border-gray-300 bg-surface px-5 py-3 text-sm font-semibold text-gray-600 transition-all duration-150 hover:bg-gray-100 active:scale-[0.97] disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={() => onSelect(selected)}
          disabled={loading}
          className="flex-1 rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

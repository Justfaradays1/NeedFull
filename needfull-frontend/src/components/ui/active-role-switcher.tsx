'use client';

import { useState } from 'react';
import { ChevronDown, Check, Briefcase, UserCheck, Building2 } from 'lucide-react';
import { useAuthUser, useUserRoles, useActiveRole, useAuthStore } from '@/store';
import { post } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const ROLE_META: Record<string, { label: string; icon: typeof Briefcase }> = {
  poster: { label: 'Poster', icon: Briefcase },
  runner: { label: 'Runner', icon: UserCheck },
  business: { label: 'Business', icon: Building2 },
};

export function ActiveRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const user = useAuthUser();
  const roles = useUserRoles();
  const activeRole = useActiveRole();
  const setUser = useAuthStore((s) => s.setUser);

  if (!user || roles.length <= 1) return null;

  const meta = ROLE_META[activeRole] || ROLE_META.poster;
  const Icon = meta.icon;

  const handleSwitch = async (role: string) => {
    try {
      const res = await post<{ success: boolean; data: { activeRole: string } }>('/users/me/switch-role', { role });
      if (res.success) {
        setUser({ ...user, activeRole: res.data.activeRole });
        setOpen(false);
      }
    } catch {
      toast.error('Failed to switch role');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="tap-target flex items-center gap-2 rounded-xl border border-card-border bg-surface px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <Icon className="h-4 w-4 text-brand" />
        <span>{meta.label}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-card-border bg-surface p-1 shadow-lifted">
            {roles.map((role) => {
              const m = ROLE_META[role] || { label: role, icon: Briefcase };
              const RIcon = m.icon;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSwitch(role)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    role === activeRole
                      ? 'bg-brand-light text-brand'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <RIcon className="h-4 w-4" />
                  <span className="flex-1 capitalize">{m.label}</span>
                  {role === activeRole && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { User } from 'lucide-react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<Size, { container: string; text: string; icon: number }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', icon: 12 },
  sm: { container: 'h-7 w-7', text: 'text-xs', icon: 14 },
  md: { container: 'h-8 w-8', text: 'text-sm', icon: 16 },
  lg: { container: 'h-9 w-9', text: 'text-sm', icon: 18 },
  xl: { container: 'h-16 w-16', text: 'text-2xl', icon: 28 },
};

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: Size;
  className?: string;
  border?: boolean;
}

function getInitial(name?: string | null, email?: string | null): string | null {
  if (name) {
    const first = name.trim().charAt(0);
    if (first) return first.toUpperCase();
  }
  if (email) {
    const first = email.trim().charAt(0);
    if (first) return first.toUpperCase();
  }
  return null;
}

export function Avatar({ src, name, email, size = 'md', className = '', border = false }: AvatarProps) {
  const dims = SIZE_MAP[size];
  const initial = getInitial(name, email);

  if (src) {
    return (
      <img
        src={src}
        alt={name || email || ''}
        className={`${dims.container} rounded-full object-cover ${border ? 'border-2 border-white/30' : ''} ${className}`}
      />
    );
  }

  if (initial) {
    return (
      <div
        className={`${dims.container} flex items-center justify-center rounded-full bg-brand ${dims.text} font-bold text-white ${border ? 'border-2 border-white/30' : ''} ${className}`}
        aria-label={name || email || undefined}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`${dims.container} flex items-center justify-center rounded-full bg-gray-100 text-gray-400 ${border ? 'border-2 border-white/30' : ''} ${className}`}
      aria-label="User avatar"
    >
      <User size={dims.icon} />
    </div>
  );
}

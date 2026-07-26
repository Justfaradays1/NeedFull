'use client';

import { useState, useCallback } from 'react';
import type { CelebrationConfig, CelebrationRole, CelebrationAction } from '@/lib/celebration-content';
import { getDefaultContent } from '@/lib/celebration-content';

export function useCelebration() {
  const [config, setConfig] = useState<CelebrationConfig | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((cfg: CelebrationConfig) => {
    setConfig(cfg);
    setOpen(true);
  }, []);

  const showForAction = useCallback(
    (role: CelebrationRole, action: CelebrationAction, overrides?: Partial<CelebrationConfig>) => {
      const base = getDefaultContent(role, action);
      setConfig({ ...base, ...overrides });
      setOpen(true);
    },
    [],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return { config, open, show, showForAction, close };
}

'use client';

import * as React from 'react';
import { applyThemeClass, useThemeStore } from '@/shared/store/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  React.useEffect(() => {
    const syncFromStorage = () => {
      applyThemeClass(useThemeStore.getState().mode);
    };

    const persist = useThemeStore.persist;
    if (persist?.hasHydrated?.()) {
      syncFromStorage();
      return;
    }

    return persist?.onFinishHydration?.(syncFromStorage);
  }, []);

  React.useEffect(() => {
    applyThemeClass(mode);
  }, [mode]);

  React.useEffect(() => {
    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  return children;
}

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

  return children;
}

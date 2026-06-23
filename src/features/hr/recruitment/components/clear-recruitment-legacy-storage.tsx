'use client';

import * as React from 'react';

const LEGACY_STORAGE_KEYS = ['recruitment-storage', 'ats-storage'] as const;

/** Removes legacy recruitment data from localStorage (one-time per session). */
export function ClearRecruitmentLegacyStorage() {
  React.useEffect(() => {
    for (const key of LEGACY_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore quota / private mode
      }
    }
  }, []);

  return null;
}

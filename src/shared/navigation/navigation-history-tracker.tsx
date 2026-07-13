'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordNavigation } from '@/shared/navigation/safe-back';

/** Keeps sessionStorage in sync with the current route for navigateSafeBack(). */
export function NavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordNavigation(pathname);
  }, [pathname]);

  return null;
}

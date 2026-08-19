'use client';

import * as React from 'react';
import { purgeStoreBindingLocalStorage } from '@/features/ecommerce/shared/lib/purge-store-local-storage';

/** Mount once to wipe legacy order/admin localStorage mirrors on bind. */
export function StoreBindingStorageCleaner() {
  React.useEffect(() => {
    purgeStoreBindingLocalStorage();
  }, []);
  return null;
}

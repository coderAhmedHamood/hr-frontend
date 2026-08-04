'use client';

import { StoreThemeSwitcher } from '@/features/ecommerce/storefront/components/store-theme-switcher';

export function StoreFooterUtilities() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <StoreThemeSwitcher />
    </div>
  );
}

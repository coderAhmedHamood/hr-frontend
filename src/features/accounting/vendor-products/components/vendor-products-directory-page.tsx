'use client';

import { VendorProductsListViews } from '@/features/accounting/vendor-products/components/vendor-products-list-views';
import { useVendorProductsDirectoryModel } from '@/features/accounting/vendor-products/hooks/useVendorProductsDirectoryModel';

export function VendorProductsDirectoryPage() {
  const model = useVendorProductsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VendorProductsListViews model={model} />
    </div>
  );
}

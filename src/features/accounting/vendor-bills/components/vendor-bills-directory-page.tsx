'use client';

import { VendorBillsListViews } from '@/features/accounting/vendor-bills/components/vendor-bills-list-views';
import { useVendorBillsDirectoryModel } from '@/features/accounting/vendor-bills/hooks/useVendorBillsDirectoryModel';

export function VendorBillsDirectoryPage() {
  const model = useVendorBillsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VendorBillsListViews model={model} />
    </div>
  );
}

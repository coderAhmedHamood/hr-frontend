'use client';

import { VendorRefundsListViews } from '@/features/accounting/vendor-refunds/components/vendor-refunds-list-views';
import { useVendorRefundsDirectoryModel } from '@/features/accounting/vendor-refunds/hooks/useVendorRefundsDirectoryModel';

export function VendorRefundsDirectoryPage() {
  const model = useVendorRefundsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VendorRefundsListViews model={model} />
    </div>
  );
}

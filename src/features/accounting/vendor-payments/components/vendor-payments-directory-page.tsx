'use client';

import { VendorPaymentsListViews } from '@/features/accounting/vendor-payments/components/vendor-payments-list-views';
import { useVendorPaymentsDirectoryModel } from '@/features/accounting/vendor-payments/hooks/useVendorPaymentsDirectoryModel';

export function VendorPaymentsDirectoryPage() {
  const model = useVendorPaymentsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VendorPaymentsListViews model={model} />
    </div>
  );
}

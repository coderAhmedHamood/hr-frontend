'use client';

import { VendorsListViews } from '@/features/accounting/vendors/components/vendors-list-views';
import { useVendorsDirectoryModel } from '@/features/accounting/vendors/hooks/useVendorsDirectoryModel';

export function VendorsDirectoryPage() {
  const model = useVendorsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VendorsListViews model={model} />
    </div>
  );
}

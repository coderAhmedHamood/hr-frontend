'use client';

import { CustomersListViews } from '@/features/accounting/customers/components/customers-list-views';
import { useCustomersDirectoryModel } from '@/features/accounting/customers/hooks/useCustomersDirectoryModel';

export function CustomersDirectoryPage() {
  const model = useCustomersDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomersListViews model={model} />
    </div>
  );
}

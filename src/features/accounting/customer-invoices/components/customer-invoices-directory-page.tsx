'use client';

import { CustomerInvoicesListViews } from '@/features/accounting/customer-invoices/components/customer-invoices-list-views';
import { useCustomerInvoicesDirectoryModel } from '@/features/accounting/customer-invoices/hooks/useCustomerInvoicesDirectoryModel';

export function CustomerInvoicesDirectoryPage() {
  const model = useCustomerInvoicesDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomerInvoicesListViews model={model} />
    </div>
  );
}

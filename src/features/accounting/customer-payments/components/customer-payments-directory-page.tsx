'use client';

import { CustomerPaymentsListViews } from '@/features/accounting/customer-payments/components/customer-payments-list-views';
import { useCustomerPaymentsDirectoryModel } from '@/features/accounting/customer-payments/hooks/useCustomerPaymentsDirectoryModel';

export function CustomerPaymentsDirectoryPage() {
  const model = useCustomerPaymentsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomerPaymentsListViews model={model} />
    </div>
  );
}

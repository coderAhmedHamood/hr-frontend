'use client';

import { CustomerCreditNotesListViews } from '@/features/accounting/customer-credit-notes/components/customer-credit-notes-list-views';
import { useCustomerCreditNotesDirectoryModel } from '@/features/accounting/customer-credit-notes/hooks/useCustomerCreditNotesDirectoryModel';

export function CustomerCreditNotesDirectoryPage() {
  const model = useCustomerCreditNotesDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomerCreditNotesListViews model={model} />
    </div>
  );
}

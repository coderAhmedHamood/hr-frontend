import * as React from 'react';
import { CustomerInvoicesListPage } from '@/features/accounting/customer-invoices/components/customer-invoices-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerInvoicesListPage />
    </React.Suspense>
  );
}

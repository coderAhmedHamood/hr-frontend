import * as React from 'react';
import { CustomerInvoicesDirectoryPage } from '@/features/accounting/customer-invoices/components/customer-invoices-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerInvoicesDirectoryPage />
    </React.Suspense>
  );
}

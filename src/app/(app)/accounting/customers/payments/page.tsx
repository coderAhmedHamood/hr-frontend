import * as React from 'react';
import { CustomerPaymentsDirectoryPage } from '@/features/accounting/customer-payments/components/customer-payments-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerPaymentsDirectoryPage />
    </React.Suspense>
  );
}

import * as React from 'react';
import { CustomerPaymentsListPage } from '@/features/accounting/customer-payments/components/customer-payments-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerPaymentsListPage />
    </React.Suspense>
  );
}

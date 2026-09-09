import * as React from 'react';
import { VendorPaymentsListPage } from '@/features/accounting/vendor-payments/components/vendor-payments-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorPaymentsListPage />
    </React.Suspense>
  );
}

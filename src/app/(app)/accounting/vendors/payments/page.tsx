import * as React from 'react';
import { VendorPaymentsDirectoryPage } from '@/features/accounting/vendor-payments/components/vendor-payments-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorPaymentsDirectoryPage />
    </React.Suspense>
  );
}

import * as React from 'react';
import { VendorRefundsDirectoryPage } from '@/features/accounting/vendor-refunds/components/vendor-refunds-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorRefundsDirectoryPage />
    </React.Suspense>
  );
}

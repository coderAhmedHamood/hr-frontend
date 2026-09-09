import * as React from 'react';
import { VendorRefundsListPage } from '@/features/accounting/vendor-refunds/components/vendor-refunds-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorRefundsListPage />
    </React.Suspense>
  );
}

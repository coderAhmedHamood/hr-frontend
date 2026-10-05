import * as React from 'react';
import { VendorProductsDirectoryPage } from '@/features/accounting/vendor-products/components/vendor-products-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorProductsDirectoryPage />
    </React.Suspense>
  );
}

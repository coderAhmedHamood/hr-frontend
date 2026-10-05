import * as React from 'react';
import { CustomerProductsDirectoryPage } from '@/features/accounting/customer-products/components/customer-products-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerProductsDirectoryPage />
    </React.Suspense>
  );
}

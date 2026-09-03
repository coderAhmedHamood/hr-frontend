import * as React from 'react';
import { CustomerProductsListPage } from '@/features/accounting/customer-products/components/customer-products-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerProductsListPage />
    </React.Suspense>
  );
}

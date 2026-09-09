import * as React from 'react';
import { CustomersListPage } from '@/features/accounting/customers/components/customers-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomersListPage />
    </React.Suspense>
  );
}

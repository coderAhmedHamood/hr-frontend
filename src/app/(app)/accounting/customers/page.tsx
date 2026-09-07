import * as React from 'react';
import { CustomersDirectoryPage } from '@/features/accounting/customers/components/customers-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomersDirectoryPage />
    </React.Suspense>
  );
}

import * as React from 'react';
import { TaxesListPage } from '@/features/accounting/taxes/components/taxes-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <TaxesListPage />
    </React.Suspense>
  );
}

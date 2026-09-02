import * as React from 'react';
import { FiscalPositionsListPage } from '@/features/accounting/fiscal-positions/components/fiscal-positions-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <FiscalPositionsListPage />
    </React.Suspense>
  );
}

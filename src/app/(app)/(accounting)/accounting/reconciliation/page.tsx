import * as React from 'react';
import { ReconciliationListPage } from '@/features/accounting/reconciliation/components/reconciliation-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ReconciliationListPage />
    </React.Suspense>
  );
}

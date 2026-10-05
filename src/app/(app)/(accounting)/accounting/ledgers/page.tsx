import * as React from 'react';
import { MultiLedgersListPage } from '@/features/accounting/ledgers/components/multi-ledgers-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <MultiLedgersListPage />
    </React.Suspense>
  );
}

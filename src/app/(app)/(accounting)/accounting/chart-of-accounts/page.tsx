import * as React from 'react';
import { ChartOfAccountsListPage } from '@/features/accounting/chart-of-accounts/components/chart-of-accounts-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ChartOfAccountsListPage />
    </React.Suspense>
  );
}

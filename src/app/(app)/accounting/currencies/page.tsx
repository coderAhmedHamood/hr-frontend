import * as React from 'react';
import { CurrenciesListPage } from '@/features/accounting/currencies/components/currencies-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CurrenciesListPage />
    </React.Suspense>
  );
}

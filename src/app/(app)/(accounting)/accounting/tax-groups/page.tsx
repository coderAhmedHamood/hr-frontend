import * as React from 'react';
import { TaxGroupsListPage } from '@/features/accounting/tax-groups/components/tax-groups-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <TaxGroupsListPage />
    </React.Suspense>
  );
}

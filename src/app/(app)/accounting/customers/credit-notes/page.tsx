import * as React from 'react';
import { CustomerCreditNotesListPage } from '@/features/accounting/customer-credit-notes/components/customer-credit-notes-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerCreditNotesListPage />
    </React.Suspense>
  );
}

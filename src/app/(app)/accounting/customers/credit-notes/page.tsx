import * as React from 'react';
import { CustomerCreditNotesDirectoryPage } from '@/features/accounting/customer-credit-notes/components/customer-credit-notes-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CustomerCreditNotesDirectoryPage />
    </React.Suspense>
  );
}

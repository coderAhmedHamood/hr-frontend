import * as React from 'react';
import { LoansDirectoryPage } from '@/features/accounting/loans/components/loans-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <LoansDirectoryPage />
    </React.Suspense>
  );
}

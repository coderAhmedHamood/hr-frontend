import * as React from 'react';
import { VendorsDirectoryPage } from '@/features/accounting/vendors/components/vendors-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorsDirectoryPage />
    </React.Suspense>
  );
}

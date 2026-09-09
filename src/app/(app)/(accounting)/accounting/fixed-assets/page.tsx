import * as React from 'react';
import { FixedAssetsDirectoryPage } from '@/features/accounting/fixed-assets/components/fixed-assets-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <FixedAssetsDirectoryPage />
    </React.Suspense>
  );
}

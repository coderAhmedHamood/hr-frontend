import * as React from 'react';
import { JournalsListPage } from '@/features/accounting/journals/components/journals-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <JournalsListPage />
    </React.Suspense>
  );
}

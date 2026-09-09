import * as React from 'react';
import { JournalEntriesListPage } from '@/features/accounting/journal-entries/components/journal-entries-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <JournalEntriesListPage />
    </React.Suspense>
  );
}

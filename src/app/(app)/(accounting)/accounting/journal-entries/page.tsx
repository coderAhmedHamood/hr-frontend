import * as React from 'react';
import { JournalEntriesDirectoryPage } from '@/features/accounting/journal-entries/components/journal-entries-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <JournalEntriesDirectoryPage />
    </React.Suspense>
  );
}

'use client';

import { JournalEntriesListViews } from '@/features/accounting/journal-entries/components/journal-entries-list-views';
import { useJournalEntriesDirectoryModel } from '@/features/accounting/journal-entries/hooks/useJournalEntriesDirectoryModel';

export function JournalEntriesDirectoryPage() {
  const model = useJournalEntriesDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <JournalEntriesListViews model={model} />
    </div>
  );
}

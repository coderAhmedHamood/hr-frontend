import * as React from 'react';
import { JournalEntryFormPage } from '@/features/accounting/journal-entries/components/journal-entry-form-page';

interface PageProps {
  params: Promise<{
    entryId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { entryId } = await params;
  return (
    <React.Suspense fallback={null}>
      <JournalEntryFormPage entryId={entryId} />
    </React.Suspense>
  );
}

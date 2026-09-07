import * as React from 'react';
import { JournalFormPage } from '@/features/accounting/journals/components/journal-form-page';

export default async function Page({ params }: { params: Promise<{ journalId: string }> }) {
  const { journalId } = await params;
  return (
    <React.Suspense fallback={null}>
      <JournalFormPage journalId={journalId} />
    </React.Suspense>
  );
}

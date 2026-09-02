import * as React from 'react';
import { JournalFormPage } from '@/features/accounting/journals/components/journal-form-page';

export default function Page({ params }: { params: { journalId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <JournalFormPage journalId={params.journalId} />
    </React.Suspense>
  );
}

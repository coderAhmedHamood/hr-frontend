import * as React from 'react';
import { CustomerCreditNoteFormPage } from '@/features/accounting/customer-credit-notes/components/customer-credit-note-form-page';

export default async function Page({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CustomerCreditNoteFormPage creditNoteId={noteId} />
    </React.Suspense>
  );
}

import * as React from 'react';
import { CustomerCreditNoteFormPage } from '@/features/accounting/customer-credit-notes/components/customer-credit-note-form-page';

export default function Page({ params }: { params: { noteId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CustomerCreditNoteFormPage creditNoteId={params.noteId} />
    </React.Suspense>
  );
}

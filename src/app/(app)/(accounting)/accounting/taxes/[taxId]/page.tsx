import * as React from 'react';
import { TaxFormPage } from '@/features/accounting/taxes/components/tax-form-page';

export default function Page({ params }: { params: { taxId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <TaxFormPage taxId={params.taxId} />
    </React.Suspense>
  );
}

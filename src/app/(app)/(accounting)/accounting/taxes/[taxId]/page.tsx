import * as React from 'react';
import { TaxFormPage } from '@/features/accounting/taxes/components/tax-form-page';

export default async function Page({ params }: { params: Promise<{ taxId: string }> }) {
  const { taxId } = await params;
  return (
    <React.Suspense fallback={null}>
      <TaxFormPage taxId={taxId} />
    </React.Suspense>
  );
}

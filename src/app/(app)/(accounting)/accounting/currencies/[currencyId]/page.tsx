import * as React from 'react';
import { CurrencyFormPage } from '@/features/accounting/currencies/components/currency-form-page';

export default async function Page({ params }: { params: Promise<{ currencyId: string }> }) {
  const { currencyId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CurrencyFormPage currencyId={currencyId} />
    </React.Suspense>
  );
}

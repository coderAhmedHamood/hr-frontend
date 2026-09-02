import * as React from 'react';
import { CurrencyFormPage } from '@/features/accounting/currencies/components/currency-form-page';

export default function Page({ params }: { params: { currencyId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CurrencyFormPage currencyId={params.currencyId} />
    </React.Suspense>
  );
}

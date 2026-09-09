import * as React from 'react';
import { FiscalPositionFormPage } from '@/features/accounting/fiscal-positions/components/fiscal-position-form-page';

export default function Page({ params }: { params: { positionId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <FiscalPositionFormPage positionId={params.positionId} />
    </React.Suspense>
  );
}

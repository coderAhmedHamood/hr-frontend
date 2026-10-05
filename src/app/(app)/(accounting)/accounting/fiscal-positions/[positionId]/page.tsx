import * as React from 'react';
import { FiscalPositionFormPage } from '@/features/accounting/fiscal-positions/components/fiscal-position-form-page';

export default async function Page({ params }: { params: Promise<{ positionId: string }> }) {
  const { positionId } = await params;
  return (
    <React.Suspense fallback={null}>
      <FiscalPositionFormPage positionId={positionId} />
    </React.Suspense>
  );
}

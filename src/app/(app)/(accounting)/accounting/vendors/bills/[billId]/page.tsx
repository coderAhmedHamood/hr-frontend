import * as React from 'react';
import { VendorBillFormPage } from '@/features/accounting/vendor-bills/components/vendor-bill-form-page';

export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  return (
    <React.Suspense fallback={null}>
      <VendorBillFormPage billId={billId} />
    </React.Suspense>
  );
}

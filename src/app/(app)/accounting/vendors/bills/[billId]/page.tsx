import * as React from 'react';
import { VendorBillFormPage } from '@/features/accounting/vendor-bills/components/vendor-bill-form-page';

export default function Page({ params }: { params: { billId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <VendorBillFormPage billId={params.billId} />
    </React.Suspense>
  );
}

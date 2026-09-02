import * as React from 'react';
import { VendorFormPage } from '@/features/accounting/vendors/components/vendor-form-page';

export default function Page({ params }: { params: { vendorId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <VendorFormPage vendorId={params.vendorId} />
    </React.Suspense>
  );
}

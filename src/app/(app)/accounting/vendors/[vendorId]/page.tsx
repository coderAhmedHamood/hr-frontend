import * as React from 'react';
import { VendorFormPage } from '@/features/accounting/vendors/components/vendor-form-page';

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  return (
    <React.Suspense fallback={null}>
      <VendorFormPage vendorId={vendorId} />
    </React.Suspense>
  );
}

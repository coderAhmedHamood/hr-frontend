import * as React from 'react';
import { VendorRefundFormPage } from '@/features/accounting/vendor-refunds/components/vendor-refund-form-page';

export default function Page({ params }: { params: { refundId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <VendorRefundFormPage refundId={params.refundId} />
    </React.Suspense>
  );
}

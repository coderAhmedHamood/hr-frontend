import * as React from 'react';
import { VendorRefundFormPage } from '@/features/accounting/vendor-refunds/components/vendor-refund-form-page';

export default async function Page({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await params;
  return (
    <React.Suspense fallback={null}>
      <VendorRefundFormPage refundId={refundId} />
    </React.Suspense>
  );
}

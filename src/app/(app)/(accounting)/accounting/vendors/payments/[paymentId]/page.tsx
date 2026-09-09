import * as React from 'react';
import { VendorPaymentFormPage } from '@/features/accounting/vendor-payments/components/vendor-payment-form-page';

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return (
    <React.Suspense fallback={null}>
      <VendorPaymentFormPage paymentId={paymentId} />
    </React.Suspense>
  );
}

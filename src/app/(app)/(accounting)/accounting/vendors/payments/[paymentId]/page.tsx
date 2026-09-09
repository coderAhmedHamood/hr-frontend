import * as React from 'react';
import { VendorPaymentFormPage } from '@/features/accounting/vendor-payments/components/vendor-payment-form-page';

export default function Page({ params }: { params: { paymentId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <VendorPaymentFormPage paymentId={params.paymentId} />
    </React.Suspense>
  );
}

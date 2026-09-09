import * as React from 'react';
import { CustomerPaymentFormPage } from '@/features/accounting/customer-payments/components/customer-payment-form-page';

export default function Page({ params }: { params: { paymentId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CustomerPaymentFormPage paymentId={params.paymentId} />
    </React.Suspense>
  );
}

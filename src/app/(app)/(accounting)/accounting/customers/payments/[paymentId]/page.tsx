import * as React from 'react';
import { CustomerPaymentFormPage } from '@/features/accounting/customer-payments/components/customer-payment-form-page';

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CustomerPaymentFormPage paymentId={paymentId} />
    </React.Suspense>
  );
}

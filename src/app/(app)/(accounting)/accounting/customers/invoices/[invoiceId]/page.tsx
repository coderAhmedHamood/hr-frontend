import * as React from 'react';
import { CustomerInvoiceFormPage } from '@/features/accounting/customer-invoices/components/customer-invoice-form-page';

export default function Page({ params }: { params: { invoiceId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CustomerInvoiceFormPage invoiceId={params.invoiceId} />
    </React.Suspense>
  );
}

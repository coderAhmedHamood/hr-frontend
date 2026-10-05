import * as React from 'react';
import { CustomerInvoiceFormPage } from '@/features/accounting/customer-invoices/components/customer-invoice-form-page';

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CustomerInvoiceFormPage invoiceId={invoiceId} />
    </React.Suspense>
  );
}

import * as React from 'react';
import { CustomerFormPage } from '@/features/accounting/customers/components/customer-form-page';

export default function Page({ params }: { params: { customerId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CustomerFormPage customerId={params.customerId} />
    </React.Suspense>
  );
}

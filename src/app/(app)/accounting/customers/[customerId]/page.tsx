import * as React from 'react';
import { CustomerFormPage } from '@/features/accounting/customers/components/customer-form-page';

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CustomerFormPage customerId={customerId} />
    </React.Suspense>
  );
}

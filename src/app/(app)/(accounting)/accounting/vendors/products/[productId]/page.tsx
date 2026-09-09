import * as React from 'react';
import { CustomerProductFormPage } from '@/features/accounting/customer-products/components/customer-product-form-page';

export default function Page({ params }: { params: { productId: string } }) {
  return (
    <React.Suspense fallback={null}>
      <CustomerProductFormPage productId={params.productId} />
    </React.Suspense>
  );
}

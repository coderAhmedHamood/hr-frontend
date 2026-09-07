import * as React from 'react';
import { CustomerProductFormPage } from '@/features/accounting/customer-products/components/customer-product-form-page';

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return (
    <React.Suspense fallback={null}>
      <CustomerProductFormPage productId={productId} />
    </React.Suspense>
  );
}

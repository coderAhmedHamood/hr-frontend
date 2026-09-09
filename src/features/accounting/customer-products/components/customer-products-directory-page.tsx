'use client';

import { CustomerProductsListViews } from '@/features/accounting/customer-products/components/customer-products-list-views';
import { useCustomerProductsDirectoryModel } from '@/features/accounting/customer-products/hooks/useCustomerProductsDirectoryModel';

export function CustomerProductsDirectoryPage() {
  const model = useCustomerProductsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CustomerProductsListViews model={model} />
    </div>
  );
}

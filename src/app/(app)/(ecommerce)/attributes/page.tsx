import * as React from 'react';
import { AttributesListPage } from '@/features/ecommerce/admin/attributes/components/attributes-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <AttributesListPage />
    </React.Suspense>
  );
}

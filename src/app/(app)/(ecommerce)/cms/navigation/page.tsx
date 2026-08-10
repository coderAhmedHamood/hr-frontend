import * as React from 'react';
import { NavigationBuilderPage } from '@/features/ecommerce/admin/cms/navigation/components/navigation-builder-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <NavigationBuilderPage />
    </React.Suspense>
  );
}

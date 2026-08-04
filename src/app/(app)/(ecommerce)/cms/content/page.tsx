import * as React from 'react';
import { ContentDomainPage } from '@/features/ecommerce/admin/cms/content/components/content-domain-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ContentDomainPage />
    </React.Suspense>
  );
}

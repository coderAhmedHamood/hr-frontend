import * as React from 'react';
import { LocationsListPage } from '@/features/inventory/admin/locations/components/locations-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <LocationsListPage />
    </React.Suspense>
  );
}

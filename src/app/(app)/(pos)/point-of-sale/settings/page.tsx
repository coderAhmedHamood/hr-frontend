import { Suspense } from 'react';
import { PosSettingsPage } from '@/features/pos/components/admin/pos-settings-page';

export default function Page() {
  return (
    <Suspense>
      <PosSettingsPage />
    </Suspense>
  );
}

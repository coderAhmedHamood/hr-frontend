'use client';

import { FixedAssetsListViews } from '@/features/accounting/fixed-assets/components/fixed-assets-list-views';
import { useFixedAssetsDirectoryModel } from '@/features/accounting/fixed-assets/hooks/useFixedAssetsDirectoryModel';

export function FixedAssetsDirectoryPage() {
  const model = useFixedAssetsDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FixedAssetsListViews model={model} />
    </div>
  );
}

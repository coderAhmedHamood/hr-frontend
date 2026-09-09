import * as React from 'react';
import { FixedAssetFormPage } from '@/features/accounting/fixed-assets/components/fixed-asset-form-page';

interface PageProps {
  params: Promise<{
    assetId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { assetId } = await params;
  return (
    <React.Suspense fallback={null}>
      <FixedAssetFormPage assetId={assetId} />
    </React.Suspense>
  );
}

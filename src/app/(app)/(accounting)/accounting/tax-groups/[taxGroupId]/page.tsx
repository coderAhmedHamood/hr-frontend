import * as React from 'react';
import { TaxGroupFormPage } from '@/features/accounting/tax-groups/components/tax-group-form-page';

interface PageProps {
  params: Promise<{
    taxGroupId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <React.Suspense fallback={null}>
      <TaxGroupFormPage taxGroupId={resolvedParams.taxGroupId} />
    </React.Suspense>
  );
}

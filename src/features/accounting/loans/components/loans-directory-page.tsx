'use client';

import { LoansListViews } from '@/features/accounting/loans/components/loans-list-views';
import { useLoansDirectoryModel } from '@/features/accounting/loans/hooks/useLoansDirectoryModel';

export function LoansDirectoryPage() {
  const model = useLoansDirectoryModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LoansListViews model={model} />
    </div>
  );
}

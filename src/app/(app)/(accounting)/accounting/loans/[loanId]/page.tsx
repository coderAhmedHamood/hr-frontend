import * as React from 'react';
import { LoanFormPage } from '@/features/accounting/loans/components/loan-form-page';

interface PageProps {
  params: Promise<{
    loanId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { loanId } = await params;
  return (
    <React.Suspense fallback={null}>
      <LoanFormPage loanId={loanId} />
    </React.Suspense>
  );
}

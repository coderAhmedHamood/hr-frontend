import * as React from 'react';
import CashReceiptPrintPage from '@/features/hr/print/cash-receipt/components/cash-receipt-print-page';

export default async function CashReceiptPrintRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"
            role="status"
            aria-label="جاري التحميل"
          />
        </div>
      }
    >
      <CashReceiptPrintPage voucherId={id} />
    </React.Suspense>
  );
}

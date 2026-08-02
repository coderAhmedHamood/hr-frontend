'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  getAccessTokenFromCookie,
  setAccessTokenCookie,
} from '@/features/auth/lib/auth-cookie';
import { Button } from '@/components/ui/button';
import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { cashReceiptVouchersApi } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import type { CashReceiptVoucherDto } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { buildCashReceiptPrintFields } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import type { Employee } from '@/features/hr/organization/employees/types';
import { CashReceiptPrintHtml } from '@/features/hr/payroll/reports/components/pdf-cash-receipt-print-html';

/**
 * Embeddable cash-receipt print view — same `CashReceiptPrintHtml` as the dashboard.
 * Mobile WebView: `/hr/print/cash-receipt/{id}?access_token=…&embed=1`
 * Hand-sign download: add `&download=1` to auto-export PDF.
 */
export default function CashReceiptPrintPage({ voucherId }: { voucherId: string }) {
  const searchParams = useSearchParams();
  const pdfCompany = usePdfCompanyLetterhead();
  const printRef = React.useRef<HTMLDivElement>(null);

  const [voucher, setVoucher] = React.useState<CashReceiptVoucherDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const tokenBootstrapped = React.useRef(false);
  const autoDownloadDone = React.useRef(false);
  const wantsDownload = searchParams.get('download') === '1';
  const isEmbed = searchParams.get('embed') === '1';

  if (!tokenBootstrapped.current) {
    const tokenFromQuery = searchParams.get('access_token')?.trim();
    if (tokenFromQuery && !getAccessTokenFromCookie()) {
      setAccessTokenCookie(tokenFromQuery);
    }
    tokenBootstrapped.current = true;
  }

  // Strip token from the address bar without a Next.js navigation.
  // `router.replace` re-triggers WebView onPageStarted without onPageFinished,
  // which leaves the mobile preview spinner stuck forever.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const tokenFromQuery = searchParams.get('access_token');
    if (!tokenFromQuery) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('access_token');
    const qs = next.toString();
    const path = qs
      ? `/hr/print/cash-receipt/${voucherId}?${qs}`
      : `/hr/print/cash-receipt/${voucherId}`;
    window.history.replaceState(window.history.state, '', path);
  }, [searchParams, voucherId]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await cashReceiptVouchersApi.getById(voucherId);
        if (!cancelled) {
          if (!row || typeof row !== 'object' || !('id' in row) || !row.id) {
            setError('تعذر تحميل السند (غير مصرح أو غير موجود)');
            setVoucher(null);
          } else {
            setVoucher(row);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(handleApiError(err, 'print.cash-receipt').displayMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [voucherId]);

  const companyNameAr =
    voucher?.institutionNameAr?.trim() || pdfCompany.companyNameAr;
  const companyNameEn = pdfCompany.companyNameEn;

  const employeeStub = React.useMemo((): Employee => {
    return {
      id: voucher?.employeeId ?? '',
      name: voucher?.recipientNameAr ?? '',
      branchNameAr: voucher?.branchNameAr ?? undefined,
    } as Employee;
  }, [voucher]);

  const handleDownloadPdf = React.useCallback(async () => {
    const el = printRef.current;
    if (!el || !voucher) return;
    setExporting(true);
    try {
      await exportDomToPdf(el, `cash-receipt-${voucher.voucherNumber || voucher.id}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [voucher]);

  React.useEffect(() => {
    if (!wantsDownload || !voucher || loading || autoDownloadDone.current) return;
    autoDownloadDone.current = true;
    const timer = window.setTimeout(() => {
      void handleDownloadPdf();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [wantsDownload, voucher, loading, handleDownloadPdf]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="جاري التحميل"
        />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 text-center" dir="rtl">
        <p className="text-sm text-muted-foreground">{error ?? 'تعذر تحميل السند'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4" dir="rtl">
      {!isEmbed || wantsDownload ? (
        <div className="mx-auto mb-3 flex max-w-[210mm] justify-end px-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exporting}
            onClick={() => void handleDownloadPdf()}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            تحميل PDF
          </Button>
        </div>
      ) : null}
      <CashReceiptPrintHtml
        ref={printRef}
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
        fields={buildCashReceiptPrintFields(voucher, {
          employee: employeeStub,
          companyNameAr,
        })}
      />
    </div>
  );
}

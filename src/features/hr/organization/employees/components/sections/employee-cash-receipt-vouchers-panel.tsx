'use client';

import * as React from 'react';
import { Banknote, Download, FileCheck2, FileText, Loader2, Plus, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  CASH_RECEIPT_VOUCHER_PURPOSE_LABELS,
  cashReceiptVouchersApi,
  type CashReceiptEmployeeSignatureStatus,
  type CashReceiptVoucherDto,
  type CashReceiptVoucherPurpose,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { useEmployeeCashReceiptVouchers } from '@/features/hr/organization/employees/hooks/useEmployeeCashReceiptVouchers';
import { EmployeeCashReceiptVoucherCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-cash-receipt-voucher-create-dialog';
import { sendSalaryVoucherToEmployeeNotification } from '@/features/hr/organization/employees/services/rose-forms-notification.service';

function statusLabel(status: string) {
  switch (status) {
    case 'issued':
      return 'صادر';
    case 'revoked':
      return 'ملغى';
    case 'draft':
    default:
      return 'مسودة';
  }
}

function statusTone(status: string): 'active' | 'rejected' | 'pending' {
  if (status === 'issued') return 'active';
  if (status === 'revoked') return 'rejected';
  return 'pending';
}

function signatureLabel(status: string) {
  switch (status as CashReceiptEmployeeSignatureStatus) {
    case 'signed':
      return 'مؤكَّد';
    case 'pending':
      return 'بانتظار التأكيد';
    default:
      return null;
  }
}

function signatureTone(status: string): 'active' | 'pending' | null {
  if (status === 'signed') return 'active';
  if (status === 'pending') return 'pending';
  return null;
}

function purposeLabel(purpose: string) {
  return CASH_RECEIPT_VOUCHER_PURPOSE_LABELS[purpose as CashReceiptVoucherPurpose] ?? purpose;
}

function formatAmount(amount: string | number) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isSignedVoucher(item: CashReceiptVoucherDto) {
  return item.employeeSignatureStatus === 'signed';
}

type Props = {
  employee: Employee;
};

function canSendToEmployee(item: CashReceiptVoucherDto) {
  if (item.employeeSignatureStatus === 'signed') return false;
  if (item.status === 'revoked') return false;
  if (item.status === 'draft') return true;
  return item.status === 'issued' && item.employeeSignatureStatus !== 'pending';
}

export function EmployeeCashReceiptVouchersPanel({ employee }: Props) {
  const { items, total, loading, error, saving, reload, create, getById, sendToEmployee, companyId } =
    useEmployeeCashReceiptVouchers(employee, true);
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [previewCard, setPreviewCard] = React.useState<CashReceiptVoucherDto | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  const handleSendToEmployee = async (item: CashReceiptVoucherDto) => {
    setSendingId(item.id);
    try {
      const updated = await sendToEmployee(item.id);
      if (!updated || !companyId) return;
      await sendSalaryVoucherToEmployeeNotification({
        companyId,
        employeeId: employee.id,
        voucherId: updated.id,
        voucherNumber: updated.voucherNumber,
        createdBy,
      });
      toast.success('تم إرسال إشعار التوقيع للموظف');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'cash-receipt-vouchers.notify');
      toast.error(displayMessage);
    } finally {
      setSendingId(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openVoucherPdf = async (id: string) => {
    const fromList = items.find((item) => item.id === id) ?? null;
    if (fromList) setPreviewCard(fromList);
    setPreviewLoading(true);
    setPreviewIsImage(false);
    try {
      const fresh = await getById(id);
      const voucher = fresh ?? fromList;
      if (fresh) setPreviewCard(fresh);

      // Prefer archived signed file when present (also returned by /pdf for signed vouchers).
      if (voucher && isSignedVoucher(voucher) && voucher.signatureImageUrl) {
        const signedUrl = resolveUploadUrl(voucher.signatureImageUrl);
        if (signedUrl) {
          const lower = signedUrl.toLowerCase();
          setPreviewIsImage(/\.(png|jpe?g|webp|gif)(\?|$)/.test(lower));
          setPreviewUrl((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return signedUrl;
          });
          return;
        }
      }

      const { blob } = await cashReceiptVouchersApi.getPdf(id);
      const url = URL.createObjectURL(blob);
      setPreviewIsImage(blob.type.startsWith('image/'));
      setPreviewUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'cash-receipt-pdf.preview');
      toast.error(displayMessage);
      setPreviewCard(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadOfficialPdf = async (voucher: CashReceiptVoucherDto) => {
    setDownloadingId(voucher.id);
    try {
      const signed = isSignedVoucher(voucher);
      await cashReceiptVouchersApi.downloadPdf(
        voucher.id,
        signed
          ? `salary-voucher-signed-${voucher.voucherNumber}.pdf`
          : `salary-voucher-${voucher.voucherNumber}.pdf`,
      );
      toast.success(signed ? 'تم تحميل سند الراتب الموقّع' : 'تم تحميل سند الراتب');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'cash-receipt-pdf.download');
      toast.error(displayMessage);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">سندات الراتب</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            السجلات المحفوظة ({total}) — سند الراتب الموقّع يظهر هنا بعد تأكيد الموظف
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void reload()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            تحديث
          </Button>
          <Button
            type="button"
            variant="luxe"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            سند جديد
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل السندات…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد سندات راتب بعد</p>
          <p className="text-xs text-muted-foreground">أنشئ مسودة جديدة لربطها بهذا الموظف</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const sigLabel = signatureLabel(item.employeeSignatureStatus);
            const sigTone = signatureTone(item.employeeSignatureStatus);
            const signed = isSignedVoucher(item);
            const showSend = canSendToEmployee(item);
            return (
              <li key={item.id}>
                <div className="flex items-stretch gap-2 rounded-xl border border-border/70 bg-background p-3.5">
                  <button
                    type="button"
                    onClick={() => void openVoucherPdf(item.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-right transition-colors hover:opacity-90"
                  >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                      signed
                        ? 'border-primary/30 bg-primary/15 text-primary'
                        : 'border-primary/20 bg-primary/10 text-primary',
                    )}
                  >
                    {signed ? <FileCheck2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                        {item.voucherNumber}
                      </span>
                      <span className={statusPillClass(statusTone(item.status))}>
                        {statusLabel(item.status)}
                      </span>
                      {sigLabel && sigTone ? (
                        <span className={statusPillClass(sigTone)}>{sigLabel}</span>
                      ) : null}
                      <Badge variant="secondary" className="text-[10px]">
                        {purposeLabel(item.purpose)}
                      </Badge>
                    </span>
                    <span className="block text-xs font-medium text-foreground" dir="ltr">
                      {formatAmount(item.amount)} ر.س
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span>
                        التاريخ: <DisplayDate value={item.receiptDate} />
                        {item.branchNameAr ? ` · ${item.branchNameAr}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        {signed ? (
                          <>
                            <FileCheck2 className="h-3 w-3" />
                            فتح سند الراتب الموقّع
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" />
                            فتح سند الراتب
                          </>
                        )}
                      </span>
                    </span>
                  </span>
                  </button>
                  {showSend ? (
                    <Button
                      type="button"
                      variant="luxe"
                      size="sm"
                      className="h-9 shrink-0 gap-1.5 self-center text-xs"
                      disabled={saving || sendingId === item.id}
                      onClick={() => void handleSendToEmployee(item)}
                    >
                      {sendingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      إرسال للموظف
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={!!previewCard}
        onOpenChange={(openNext) => {
          if (!openNext) {
            setPreviewCard(null);
            setPreviewIsImage(false);
            setPreviewUrl((prev) => {
              if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
              return null;
            });
          }
        }}
      >
        <DialogContent className="max-w-4xl gap-3 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {previewCard
                ? `${isSignedVoucher(previewCard) ? 'سند راتب موقّع' : 'سند راتب'} — ${previewCard.voucherNumber}`
                : 'سند راتب'}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحضير الملف…
            </div>
          ) : previewUrl ? (
            <div className="space-y-3">
              {previewIsImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="سند موقّع"
                  className="mx-auto max-h-[70vh] w-auto rounded-lg border border-border bg-muted/20 object-contain"
                />
              ) : (
                <iframe
                  title="cash-receipt-pdf"
                  src={previewUrl}
                  className="h-[70vh] w-full rounded-lg border border-border bg-muted/20"
                />
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="luxe"
                  size="sm"
                  className="gap-1.5"
                  disabled={!previewCard || downloadingId === previewCard.id}
                  onClick={() => {
                    if (previewCard) void downloadOfficialPdf(previewCard);
                  }}
                >
                  {downloadingId === previewCard?.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {previewCard && isSignedVoucher(previewCard)
                    ? 'تحميل سند الراتب الموقّع'
                    : 'تحميل سند الراتب'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              تعذر تحميل المعاينة
            </p>
          )}
        </DialogContent>
      </Dialog>

      <EmployeeCashReceiptVoucherCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={create}
      />
    </div>
  );
}

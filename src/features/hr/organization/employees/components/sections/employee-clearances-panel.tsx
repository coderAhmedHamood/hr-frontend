'use client';

import * as React from 'react';
import { ClipboardCheck, FileText, Loader2, Plus, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DisplayDate } from '@/components/ui/table-cells';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeClearanceDto } from '@/features/hr/organization/employees/lib/api/employee-clearances';
import { useEmployeeClearances } from '@/features/hr/organization/employees/hooks/useEmployeeClearances';
import { EmployeeClearanceCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-clearance-create-dialog';
import {
  RoseClearancePrintHtml,
} from '@/components/pdf/rose-trading/rose-clearance-print-html';
import { buildClearancePrintFields } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import { sendClearanceToEmployeeNotification } from '@/features/hr/organization/employees/services/rose-forms-notification.service';

function statusLabel(item: { status: string; employeeSignatureStatus?: string | null }) {
  if (item.status === 'revoked') return 'ملغى';
  if (item.status === 'draft') return 'مسودة';
  if (item.employeeSignatureStatus === 'signed') return 'موقّع';
  if (item.employeeSignatureStatus === 'pending') return 'بانتظار التوقيع';
  if (item.status === 'issued') return 'صادر';
  return 'مسودة';
}

function statusTone(item: {
  status: string;
  employeeSignatureStatus?: string | null;
}): 'active' | 'rejected' | 'pending' {
  if (item.status === 'revoked') return 'rejected';
  if (item.employeeSignatureStatus === 'signed') return 'active';
  if (item.employeeSignatureStatus === 'pending' || item.status === 'draft') {
    return 'pending';
  }
  return 'active';
}

type Props = {
  employee: Employee;
  onOpenPdfPrep: () => void;
};

export function EmployeeClearancesPanel({ employee, onOpenPdfPrep }: Props) {
  const { items, total, loading, error, saving, reload, create, getById, sendToEmployee, companyId } =
    useEmployeeClearances(employee, true);
  const { data: activeCompany } = useActiveCompany();
  const pdfCompany = usePdfCompanyLetterhead();
  const companyNameAr = activeCompany?.nameAr ?? pdfCompany.companyNameAr;
  const companyNameEn = activeCompany?.nameEn ?? pdfCompany.companyNameEn;
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [previewCard, setPreviewCard] = React.useState<EmployeeClearanceDto | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  const openVoucherPdf = async (id: string) => {
    const fromList = items.find((item) => item.id === id) ?? null;
    if (fromList) setPreviewCard(fromList);
    setPreviewLoading(true);
    const fresh = await getById(id);
    if (fresh) setPreviewCard(fresh);
    setPreviewLoading(false);
  };

  const handleSendToEmployee = async (item: EmployeeClearanceDto) => {
    setSendingId(item.id);
    try {
      const updated = await sendToEmployee(item.id);
      if (!updated || !companyId) return;
      await sendClearanceToEmployeeNotification({
        companyId,
        employeeId: employee.id,
        clearanceId: updated.id,
        clearanceNumber: updated.clearanceNumber,
        createdBy,
      });
      toast.success('تم إرسال إشعار التوقيع للموظف');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-clearances.notify');
      toast.error(displayMessage);
    } finally {
      setSendingId(null);
    }
  };

  const printable = React.useMemo(() => {
    if (!previewCard) return null;
    return (
      <RoseClearancePrintHtml
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
        fields={buildClearancePrintFields(previewCard, {
          employee,
          companyNameAr,
        })}
      />
    );
  }, [previewCard, companyNameAr, companyNameEn, employee]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">إخلاءات الطرف</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            السجلات المحفوظة ({total}) — اضغط سجلاً لفتح معاينة PDF
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
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onOpenPdfPrep}
          >
            <FileText className="h-3.5 w-3.5" />
            نموذج فارغ
          </Button>
          <Button
            type="button"
            variant="luxe"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            إخلاء جديد
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
          جاري تحميل إخلاءات الطرف…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد إخلاءات طرف بعد</p>
          <p className="text-xs text-muted-foreground">أنشئ مسودة جديدة لربطها بهذا الموظف</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-stretch gap-2 rounded-xl border border-border/70 bg-background p-3.5">
                <button
                  type="button"
                  onClick={() => void openVoucherPdf(item.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-right transition-colors hover:opacity-90"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                        {item.clearanceNumber}
                      </span>
                      <span className={statusPillClass(statusTone(item))}>
                        {statusLabel(item)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{item.jobTitle}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span>
                        التاريخ: <DisplayDate value={item.clearanceDate} />
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <FileText className="h-3 w-3" />
                        فتح PDF
                      </span>
                    </span>
                  </span>
                </button>
                {item.status === 'draft' ? (
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
          ))}
        </ul>
      )}

      {previewLoading && !previewCard ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحضير معاينة PDF…
        </div>
      ) : null}

      <PdfPreviewExportDialog
        open={!!previewCard}
        onOpenChange={(openNext) => {
          if (!openNext) setPreviewCard(null);
        }}
        title={
          previewCard
            ? `إخلاء طرف — ${previewCard.clearanceNumber}`
            : 'إخلاء طرف'
        }
        fileName={
          previewCard
            ? `clearance-${previewCard.clearanceNumber}.pdf`
            : 'clearance.pdf'
        }
        printable={printable}
      />

      <EmployeeClearanceCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={create}
      />
    </div>
  );
}

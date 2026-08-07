'use client';

import * as React from 'react';
import { FileSignature, FileText, Loader2, Plus, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DisplayDate } from '@/components/ui/table-cells';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { statusPillClass } from '@/shared/status-pill-classes';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import { useEmployeeRoseFormsStore } from '@/features/hr/organization/employees/lib/employee-rose-forms/store';
import type { RoseSettlementRecord } from '@/features/hr/organization/employees/lib/employee-rose-forms/types';
import {
  EmployeeSettlementCreateDialog,
  type CreateSettlementInput,
} from '@/features/hr/organization/employees/components/dialogs/employee-settlement-create-dialog';
import {
  RoseSettlementPrintHtml,
} from '@/components/pdf/rose-trading/rose-settlement-print-html';
import { buildSettlementPrintFields } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import { sendSettlementToEmployeeNotification } from '@/features/hr/organization/employees/services/rose-forms-notification.service';

function statusLabel(status: string | undefined) {
  return status === 'sent' ? 'مُرسل للموظف' : 'مسودة';
}

function statusTone(status: string | undefined): 'active' | 'pending' {
  return status === 'sent' ? 'active' : 'pending';
}

type Props = {
  employee: Employee;
  onOpenPdfPrep: () => void;
};

export function EmployeeSettlementsPanel({ employee, onOpenPdfPrep }: Props) {
  const { data: activeCompany } = useActiveCompany();
  const companyId = useDefaultCompanyId() ?? '';
  const pdfCompany = usePdfCompanyLetterhead();
  const companyNameAr = activeCompany?.nameAr ?? pdfCompany.companyNameAr;
  const companyNameEn = activeCompany?.nameEn ?? pdfCompany.companyNameEn;
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const hasHydrated = useEmployeeRoseFormsStore((s) => s._hasHydrated);
  const finishHydration = useEmployeeRoseFormsStore((s) => s.finishHydration);
  const getBucket = useEmployeeRoseFormsStore((s) => s.getBucket);
  const addSettlement = useEmployeeRoseFormsStore((s) => s.addSettlement);
  const updateSettlement = useEmployeeRoseFormsStore((s) => s.updateSettlement);
  const bucketsVersion = useEmployeeRoseFormsStore((s) => s.buckets);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [previewCard, setPreviewCard] = React.useState<RoseSettlementRecord | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hasHydrated) finishHydration();
  }, [hasHydrated, finishHydration]);

  const items = React.useMemo(() => {
    void bucketsVersion;
    return getBucket(employee.id).settlements.map((row) => ({
      ...row,
      status: row.status ?? 'draft',
      referenceNo: row.referenceNo || row.id,
      employeeName: row.employeeName || employee.name || '—',
      nationality: row.nationality || employee.nationality || '—',
      nationalId: row.nationalId || employee.nationalId || '—',
      companyNameAr: row.companyNameAr || companyNameAr,
    }));
  }, [bucketsVersion, employee, getBucket, companyNameAr]);

  const handleCreate = async (input: CreateSettlementInput) => {
    setSaving(true);
    try {
      addSettlement(employee.id, {
        referenceNo: input.referenceNo,
        documentDate: input.documentDate,
        documentDateHijri: input.documentDateHijri,
        employeeName: input.employeeName,
        nationality: input.nationality,
        nationalId: input.nationalId,
        companyNameAr: input.companyNameAr,
        status: 'draft',
      });
      toast.success('تم حفظ المخالصة كمسودة');
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleSendToEmployee = async (item: RoseSettlementRecord) => {
    if (!companyId) {
      toast.error('لم يتم تحديد الشركة');
      return;
    }
    setSendingId(item.id);
    try {
      await sendSettlementToEmployeeNotification({
        companyId,
        employeeId: employee.id,
        settlementId: item.id,
        referenceNo: item.referenceNo || item.id,
        createdBy,
      });
      updateSettlement(employee.id, item.id, { status: 'sent' });
      toast.success('تم إرسال إشعار التوقيع للموظف');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-settlements.notify');
      toast.error(displayMessage);
    } finally {
      setSendingId(null);
    }
  };

  const printable = React.useMemo(() => {
    if (!previewCard) return null;
    return (
      <RoseSettlementPrintHtml
        companyNameAr={previewCard.companyNameAr || companyNameAr}
        companyNameEn={companyNameEn}
        fields={buildSettlementPrintFields(previewCard, {
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
          <p className="text-sm font-semibold text-foreground">المخالصات النهائية</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            السجلات المحفوظة ({items.length}) — اضغط سجلاً لفتح معاينة PDF
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => finishHydration()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
            مخالصة جديدة
          </Button>
        </div>
      </div>

      {!hasHydrated ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل المخالصات…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <FileSignature className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد مخالصات بعد</p>
          <p className="text-xs text-muted-foreground">أنشئ مخالصة جديدة لربطها بهذا الموظف</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-stretch gap-2 rounded-xl border border-border/70 bg-background p-3.5">
                <button
                  type="button"
                  onClick={() => setPreviewCard(item)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-right transition-colors hover:opacity-90"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                        {item.referenceNo || item.id}
                      </span>
                      <span className={statusPillClass(statusTone(item.status))}>
                        {statusLabel(item.status)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.employeeName || '—'}
                      {item.nationality ? ` · ${item.nationality}` : ''}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span>
                        التاريخ: <DisplayDate value={item.documentDate} />
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <FileText className="h-3 w-3" />
                        فتح PDF
                      </span>
                    </span>
                  </span>
                </button>
                {(item.status ?? 'draft') === 'draft' ? (
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

      <PdfPreviewExportDialog
        open={!!previewCard}
        onOpenChange={(openNext) => {
          if (!openNext) setPreviewCard(null);
        }}
        title={
          previewCard
            ? `مخالصة نهائية — ${previewCard.referenceNo || previewCard.id}`
            : 'مخالصة نهائية'
        }
        fileName={
          previewCard
            ? `settlement-${previewCard.referenceNo || previewCard.id}.pdf`
            : 'settlement.pdf'
        }
        printable={printable}
      />

      <EmployeeSettlementCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}

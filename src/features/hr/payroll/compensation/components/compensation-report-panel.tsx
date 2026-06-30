'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, FileSpreadsheet, FileText, Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { cn } from '@/shared/utils';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_COLORS,
  type HRPayrollPeriodRecord,
  type HRPayrollReviewStage,
} from '@/features/hr/payroll/lib/payroll-periods-store';
import {
  formatLatinNumber,
  mapEmployeesPayrollSummaryToPreviews,
  buildAttendancePushToPayrollPayload,
  resolvePayrollSummaryFooterTotals,
  type CompensationColumnVisibility,
  type CompensationAdvancesPushOptions,
  type CompensationViolationsPushOptions,
  type CompensationPushOptions,
  type PayrollLineCompensationPreview,
  periodToColumnVisibility,
  COLUMN_TO_PERIOD_INCLUDE,
  DEFAULT_COMPENSATION_COLUMN_VISIBILITY,
} from '@/features/hr/payroll/lib/compensation-preview';
import { useQueryClient } from '@tanstack/react-query';
import { useEmployeesPayrollSummary } from '@/features/hr/payroll/compensation/hooks/useEmployeesPayrollSummary';
import { usePayrollPeriod } from '@/features/hr/payroll/compensation/hooks/usePayrollPeriod';
import { PAYROLL_PERIOD_KEYS, PAYROLL_SUMMARY_KEYS } from '@/features/hr/payroll/compensation/hooks/query-keys';
import { hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId, useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { employeeAdvancesApi } from '@/features/hr/contracts/lib/api/employee-advances';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { PushFromAttendanceDialog } from '@/features/hr/payroll/compensation/components/push-from-attendance-dialog';
import { PushFromAdvancesDialog } from '@/features/hr/payroll/compensation/components/push-from-advances-dialog';
import { PushFromViolationsDialog } from '@/features/hr/payroll/compensation/components/push-from-violations-dialog';
import { CompensationIncrementAdjustDialog, type IncrementAdjustDialogContext } from '@/features/hr/payroll/compensation/components/compensation-increment-adjust-dialog';
import { CompensationDataToolbar } from '@/features/hr/payroll/compensation/components/compensation-data-toolbar';
import { AdjustableAmountCell } from '@/features/hr/payroll/compensation/components/adjustable-amount-cell';
import { createIncrementalMonthlyInput } from '@/features/hr/payroll/compensation/services/incremental-monthly-input.service';
import { PayrollPeriodReviewBar } from '@/features/hr/payroll/compensation/components/payroll-period-review-bar';
import { CompleteReviewPayslipsDialog } from '@/features/hr/payroll/compensation/components/complete-review-payslips-dialog';
import { sendPayslipGeneratedNotification } from '@/features/hr/payroll/compensation/services/payslip-notification.service';
import { payslipsApi } from '@/features/hr/payroll/lib/api/payslips';
import { CompensationPrintHtml } from '@/features/hr/payroll/compensation/components/compensation-print-html';
import {
  buildCompensationExportLines,
  buildCompensationPrintPayload,
  downloadCompensationExcel,
  downloadCompensationPdf,
} from '@/features/hr/payroll/lib/compensation-period-export';

function ReadOnlyAmountCell({ amount, colorClass }: { amount: number; colorClass?: string }) {
  return (
    <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-[11.5px]">
      <span className={colorClass}>{formatLatinNumber(amount)}</span>
    </td>
  );
}

function AllowancesBreakdownCell({ row }: { row: PayrollLineCompensationPreview }) {
  return (
    <td className="border-e border-border/40 px-3 py-2 text-right">
      {row.allowanceLines.length === 0 ? (
        <span className="text-muted-foreground text-[10px]">—</span>
      ) : (
        <div className="space-y-0.5">
          {row.allowanceLines.map((a) => (
            <div key={a.labelAr} className="flex justify-between gap-2 text-[10px]">
              <span className="text-muted-foreground">{a.labelAr}</span>
              <span className="font-mono font-semibold tabular-nums text-primary">{formatLatinNumber(a.amount)}</span>
            </div>
          ))}
          <div className="mt-0.5 flex items-center justify-between gap-1 border-t pt-1 text-right text-[10px] font-bold">
            المجموع:
            <span className="font-mono font-bold text-primary">{formatLatinNumber(row.allowancesMonthlyTotal)}</span>
          </div>
        </div>
      )}
    </td>
  );
}

function reviewAdvanceToastMessage(completedStage: HRPayrollReviewStage): string {
  if (completedStage === 'first_review') {
    return 'تم تسجيل المراجعة الأولى — الفترة الآن تحت المراجعة الثانية';
  }
  if (completedStage === 'second_review') {
    return 'تم تسجيل المراجعة الثانية — الفترة الآن تحت المراجعة الثالثة';
  }
  return 'تم إتمام المراجعة الثالثة — اكتمل مسار المراجعة';
}

function normalizePeriod(row: HRPayrollPeriodRecord): HRPayrollPeriodRecord {
  return {
    ...row,
    employmentLineMonthlyInputs: row.employmentLineMonthlyInputs ?? {},
    reviewStage: row.reviewStage ?? 'first_review',
    isReviewCompleted: row.isReviewCompleted ?? false,
  };
}

const PERIOD_STATUS_BADGE: Record<string, string> = PERIOD_STATUS_COLORS;

export function CompensationReportPanel({
  periodId,
  embedded = false,
  /** عند تحديده وعدم فراغه: عرض أسطر هؤلاء الموظفين فقط (مطابقة `employeeId` على سطر المسير) */
  employeeIdsFilter,
}: {
  periodId: string;
  embedded?: boolean;
  employeeIdsFilter?: string[] | undefined;
}) {
  const companyId             = useDefaultCompanyId();
  const queryClient           = useQueryClient();
  const advanceReview           = useHRPayrollPeriodsStore(s => s.advanceReview);
  const revertReview            = useHRPayrollPeriodsStore(s => s.revertReview);
  const updatePeriod          = useHRPayrollPeriodsStore(s => s.update);
  const {
    data: payrollSummary,
    isLoading: summaryLoading,
  } = useEmployeesPayrollSummary(periodId);
  const {
    data: periodRaw,
    isLoading: periodLoading,
  } = usePayrollPeriod(periodId);

  const invalidatePayrollSummary = React.useCallback(() => {
    if (!periodId) return;
    void queryClient.invalidateQueries({ queryKey: PAYROLL_SUMMARY_KEYS.byPeriod(periodId) });
  }, [periodId, queryClient]);

  const invalidatePayrollPeriod = React.useCallback(() => {
    if (!periodId) return;
    void queryClient.invalidateQueries({ queryKey: PAYROLL_PERIOD_KEYS.detail(periodId) });
  }, [periodId, queryClient]);

  const [pushDialogOpen, setPushDialogOpen] = React.useState(false);
  const [advancesPushDialogOpen, setAdvancesPushDialogOpen] = React.useState(false);
  const [violationsPushDialogOpen, setViolationsPushDialogOpen] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);
  const [reviewAdvancing, setReviewAdvancing] = React.useState(false);
  const [reviewReverting, setReviewReverting] = React.useState(false);
  const [thirdReviewConfirmOpen, setThirdReviewConfirmOpen] = React.useState(false);
  const [excelExporting, setExcelExporting] = React.useState(false);
  const [pdfExporting, setPdfExporting] = React.useState(false);
  const [pdfPrintMounted, setPdfPrintMounted] = React.useState(false);
  const payrollPrintRef = React.useRef<HTMLDivElement>(null);
  const [togglingCol, setTogglingCol] = React.useState<keyof CompensationColumnVisibility | null>(null);
  const [adjustDialog, setAdjustDialog] = React.useState<IncrementAdjustDialogContext | null>(null);
  const [adjustSubmitting, setAdjustSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const period = React.useMemo(() => periodRaw ? normalizePeriod(periodRaw) : null, [periodRaw]);

  const cols = React.useMemo(
    () => (period ? periodToColumnVisibility(period) : DEFAULT_COMPENSATION_COLUMN_VISIBILITY),
    [period],
  );
  const tableCols = embedded ? DEFAULT_COMPENSATION_COLUMN_VISIBILITY : cols;

  const filterKey = employeeIdsFilter?.length ? [...employeeIdsFilter].sort().join(',') : '';
  const previews = React.useMemo(() => {
    if (!payrollSummary) return [];
    let list = mapEmployeesPayrollSummaryToPreviews(payrollSummary);
    if (filterKey) {
      const allow = new Set(filterKey.split(','));
      list = list.filter(r => allow.has(r.employeeId));
    }
    return list;
  }, [payrollSummary, filterKey]);

  const periodEmployeeIds = React.useMemo(
    () => previews.map((r) => r.employeeId),
    [previews],
  );

  const hasLines = (payrollSummary?.employeesCount ?? 0) > 0;

  const footerTotals = React.useMemo(
    () => resolvePayrollSummaryFooterTotals(payrollSummary, previews, Boolean(filterKey)),
    [payrollSummary, previews, filterKey],
  );

  /** Employees in this period — used by push dialogs (no company-wide employee list fetch). */
  const pushDialogEmployees = React.useMemo(
    () => (payrollSummary?.employees ?? []).map((row) => ({
      id: row.employeeId,
      name: row.employeeNameAr?.trim() || '—',
    })),
    [payrollSummary],
  );

  const openAdjustDialog = React.useCallback((
    row: PayrollLineCompensationPreview,
    field: 'bonus' | 'admin',
  ) => {
    setAdjustDialog({
      employeeId: row.employeeId,
      employeeName: row.namePrimary,
      field,
      currentTotal: field === 'bonus' ? row.entitlementBonusSar : row.dedAdminSar,
      currency: payrollSummary?.currency ?? 'SAR',
    });
  }, [payrollSummary?.currency]);

  const handleIncrementAdjustConfirm = React.useCallback(async (payload: {
    amount: number;
    direction: 'addition' | 'deduction';
    note: string;
  }) => {
    if (!adjustDialog || !companyId || !periodId) return;
    setAdjustSubmitting(true);
    try {
      await createIncrementalMonthlyInput({
        companyId,
        payrollPeriodId: periodId,
        employeeId: adjustDialog.employeeId,
        field: adjustDialog.field,
        direction: payload.direction,
        amount: payload.amount,
        currency: adjustDialog.currency,
        note: payload.note || undefined,
        createdBy: useAuthStore.getState().user?.email ?? undefined,
      });
      invalidatePayrollSummary();
      setAdjustDialog(null);
      toast.success(
        adjustDialog.field === 'bonus'
          ? 'تمت إضافة المكافأة بنجاح'
          : payload.direction === 'addition'
            ? 'تمت الإضافة المباشرة بنجاح'
            : 'تم الخصم المباشر بنجاح',
      );
    } catch (err) {
      handleApiError(err, 'compensation.increment-input');
    } finally {
      setAdjustSubmitting(false);
    }
  }, [adjustDialog, companyId, periodId, invalidatePayrollSummary]);

  const exportLines = React.useMemo(
    () => buildCompensationExportLines(previews),
    [previews],
  );

  const payrollPrintData = React.useMemo(
    () => (period && exportLines.length > 0
      ? buildCompensationPrintPayload(period, exportLines, cols, footerTotals)
      : null),
    [period, exportLines, cols, footerTotals],
  );

  const fmt = (n: number, f = 2) => formatLatinNumber(n, f);
  const backHref = hrPayrollRoutes.payrollPeriods;

  const backBtn = (
    <Link
      href={backHref}
      className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground/70 shadow-soft transition-all hover:border-primary/30 hover:bg-accent hover:text-primary lg:h-9 lg:w-auto"
    >
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      العودة إلى فترات الراتب
    </Link>
  );

  const isResolvingPeriod = Boolean(
    periodId && (
      !companyId
      || ((summaryLoading && !payrollSummary) || (periodLoading && !period))
    ),
  );

  if (isResolvingPeriod) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل بيانات الفترة...
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start gap-4 p-6 animate-fade-in">
        {backBtn}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل بيانات الفترة...
        </div>
      </div>
    );
  }

  if (!periodId || !period) {
    if (embedded) return <p className="text-sm text-muted-foreground py-4">الفترة غير موجودة.</p>;
    return (
      <div className="flex flex-col items-start gap-4 p-6 animate-fade-in">
        {backBtn}
        <p className="text-sm text-muted-foreground">
          {!periodId ? 'معرّف الفترة غير صالح.' : 'الفترة غير موجودة.'}
        </p>
      </div>
    );
  }

  const filterActive = Boolean(filterKey);
  const isReviewLocked = period.isReviewCompleted;

  const handleDownloadExcel = async () => {
    if (!hasLines || exportLines.length === 0) {
      toast.error('لا توجد بيانات للتصدير.');
      return;
    }
    setExcelExporting(true);
    try {
      await downloadCompensationExcel(period, exportLines, cols, footerTotals);
      toast.success('تم تحميل ملف Excel.');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إنشاء ملف Excel.');
    } finally {
      setExcelExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!payrollPrintData || !period) {
      toast.error('لا توجد بيانات للتصدير.');
      return;
    }
    setPdfExporting(true);
    setPdfPrintMounted(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const el = payrollPrintRef.current;
      if (!el) {
        toast.error('تعذر العثور على منطقة الطباعة.');
        return;
      }
      await downloadCompensationPdf(el, period.code);
      toast.success('تم تحميل ملف PDF.');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير PDF.');
    } finally {
      setPdfExporting(false);
      setPdfPrintMounted(false);
    }
  };

  const handleAdvanceReview = async () => {
    if (!period || !hasLines) {
      toast.error('تأكد من وجود سجلات في الفترة قبل تسجيل المراجعة.');
      return;
    }
    setReviewAdvancing(true);
    try {
      const completedStage = period.reviewStage;
      await advanceReview(period.id);
      invalidatePayrollPeriod();
      toast.success(reviewAdvanceToastMessage(completedStage));
    } catch (err) {
      handleApiError(err, 'compensation.review-advance');
    } finally {
      setReviewAdvancing(false);
    }
  };

  const handleAdvanceReviewClick = () => {
    if (!period || !hasLines) {
      toast.error('تأكد من وجود سجلات في الفترة قبل تسجيل المراجعة.');
      return;
    }
    if (period.reviewStage === 'third_review') {
      setThirdReviewConfirmOpen(true);
      return;
    }
    void handleAdvanceReview();
  };

  const handleConfirmThirdReviewAndGenerate = async () => {
    if (!period) return;
    setReviewAdvancing(true);
    try {
      await advanceReview(period.id);
      invalidatePayrollPeriod();
      const actor = useAuthStore.getState().user?.email ?? undefined;
      const companyId = getDefaultCompanyId() ?? '';
      const created = await payslipsApi.generate({
        payrollPeriodId: period.id,
        generatedBy: actor,
      });
      const employeeIds = created.length > 0
        ? created.map((p) => p.employeeId)
        : periodEmployeeIds;

      let notificationSent = false;
      if (companyId && employeeIds.length > 0) {
        try {
          await sendPayslipGeneratedNotification({
            companyId,
            periodId: period.id,
            periodNameAr: period.nameAr,
            employeeIds,
            createdBy: actor,
          });
          notificationSent = true;
        } catch (notifErr) {
          const { displayMessage } = handleApiError(notifErr, 'compensation.payslip-notification');
          toast.error(`تم إنشاء القسائم لكن فشل إرسال الإشعار: ${displayMessage}`);
        }
      }

      setThirdReviewConfirmOpen(false);
      const payslipMessage = created.length > 0
        ? `تم إتمام المراجعة الثالثة وإنشاء ${created.length} قسيمة مسودة.`
        : 'تم إتمام المراجعة الثالثة — لم يُنشأ أي قسيمة جديدة (قد تكون موجودة مسبقاً).';
      const notificationMessage = notificationSent
        ? ` تم إرسال إشعار إلى ${[...new Set(employeeIds)].length} موظفاً.`
        : '';
      toast.success(`${payslipMessage}${notificationMessage}`);
    } catch (err) {
      handleApiError(err, 'compensation.review-advance-generate');
    } finally {
      setReviewAdvancing(false);
    }
  };

  const handleRevertReview = async () => {
    if (!period) return;
    setReviewReverting(true);
    try {
      await revertReview(period.id);
      invalidatePayrollPeriod();
      toast.success('تم التراجع عن آخر مرحلة مراجعة.');
    } catch (err) {
      handleApiError(err, 'compensation.review-revert');
    } finally {
      setReviewReverting(false);
    }
  };

  const handlePushFromAttendance = async (pushOptions: CompensationPushOptions) => {
    if (!period || isReviewLocked) return;
    if (!hasLines) {
      toast.error('أضف سجلات تشغيل في الفترة قبل مزامنة الحضور.');
      return;
    }

    const employeeIds = employeeIdsFilter?.length
      ? employeeIdsFilter
      : periodEmployeeIds;

    const createdBy = useAuthStore.getState().user?.email ?? undefined;

    setPushing(true);
    try {
      const result = await attendanceDaySummariesApi.pushToPayroll(
        buildAttendancePushToPayrollPayload(pushOptions, {
          payrollPeriodId: period.id,
          employeeIds,
          createdBy,
        }),
      );

      invalidatePayrollSummary();
      setPushDialogOpen(false);

      toast.success(
        `تم دفع الحضور: ${result.inputsCreated} مدخل جديد، ${result.inputsDeleted} محذوف، ${result.employeesProcessed} موظف.`,
      );
    } catch (err) {
      handleApiError(err, 'compensation.push-from-attendance');
    } finally {
      setPushing(false);
    }
  };

  const handlePushFromAdvances = async (pushOptions: CompensationAdvancesPushOptions) => {
    if (!period || isReviewLocked) return;
    if (!hasLines) {
      toast.error('أضف سجلات تشغيل في الفترة قبل مزامنة السلف.');
      return;
    }
    if (pushOptions.employeeIds.length === 0) {
      toast.error('يرجى اختيار موظف واحد على الأقل.');
      return;
    }

    const createdBy = useAuthStore.getState().user?.email ?? undefined;

    setPushing(true);
    try {
      const result = await employeeAdvancesApi.pushToPayroll({
        payrollPeriodId: period.id,
        employeeIds: pushOptions.employeeIds,
        replaceExisting: pushOptions.replaceExisting,
        createdBy,
      });

      invalidatePayrollSummary();
      setAdvancesPushDialogOpen(false);

      toast.success(
        `تم دفع السلف: ${result.inputsCreated} مدخل جديد، ${result.inputsDeleted} محذوف، ${result.advancesProcessed} سلفة، إجمالي ${result.totalDeducted} ر.س.`,
      );
    } catch (err) {
      handleApiError(err, 'compensation.push-from-advances');
    } finally {
      setPushing(false);
    }
  };

  const handlePushFromViolations = async (pushOptions: CompensationViolationsPushOptions) => {
    if (!period || isReviewLocked) return;
    if (!hasLines) {
      toast.error('أضف سجلات تشغيل في الفترة قبل مزامنة الجزاءات.');
      return;
    }
    if (pushOptions.employeeIds.length === 0) {
      toast.error('يرجى اختيار موظف واحد على الأقل.');
      return;
    }

    const createdBy = useAuthStore.getState().user?.email ?? undefined;

    setPushing(true);
    try {
      const result = await violationRecordsApi.pushToPayroll({
        payrollPeriodId: period.id,
        employeeIds: pushOptions.employeeIds,
        replaceExisting: pushOptions.replaceExisting,
        createdBy,
      });

      invalidatePayrollSummary();
      setViolationsPushDialogOpen(false);

      toast.success(
        `تم دفع الجزاءات: ${result.inputsCreated} مدخل جديد، ${result.inputsDeleted} محذوف، ${result.violationsProcessed} مخالفة، إجمالي ${result.totalDeducted} ر.س.`,
      );
    } catch (err) {
      handleApiError(err, 'compensation.push-from-violations');
    } finally {
      setPushing(false);
    }
  };

  const toggleCol = (k: keyof CompensationColumnVisibility) => {
    if (!period || isReviewLocked || togglingCol) return;
    const includeField = COLUMN_TO_PERIOD_INCLUDE[k];
    const next = !cols[k];
    setTogglingCol(k);
    void updatePeriod(period.id, { [includeField]: next })
      .then(ok => {
        if (!ok) toast.error('تعذر حفظ إعدادات إظهار الأعمدة.');
        else invalidatePayrollPeriod();
      })
      .finally(() => setTogglingCol(null));
  };

  return (
    <>
      {!embedded && <SetPageTitle titleAr={`تقرير المستحقات — ${period.nameAr || period.code}`} iconName="CalendarRange" />}

      <div className={cn('space-y-5 overflow-x-hidden transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}>

        {/* ══ BACK BUTTON ══ */}
        {!embedded && (
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            {backBtn}
            {hasLines && previews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 gap-1.5 text-xs lg:h-9"
                  disabled={excelExporting || pdfExporting}
                  onClick={() => void handleDownloadExcel()}
                >
                  {excelExporting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  تحميل Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 gap-1.5 text-xs lg:h-9"
                  disabled={excelExporting || pdfExporting}
                  onClick={() => void handleDownloadPdf()}
                >
                  {pdfExporting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileText className="h-3.5 w-3.5" />}
                  تحميل PDF
                </Button>
              </div>
            )}
          </div>
        )}

        {pdfPrintMounted && payrollPrintData && (
          <div
            aria-hidden
            className="pointer-events-none fixed start-0 top-0 -z-[9999] size-0 overflow-hidden"
          >
            <CompensationPrintHtml
              ref={payrollPrintRef}
              monthNameAr={payrollPrintData.monthNameAr}
              branchNameAr={payrollPrintData.branchNameAr}
              table={payrollPrintData.table}
            />
          </div>
        )}

        {!embedded && (
          <PayrollPeriodReviewBar
            period={period}
            hasLines={hasLines}
            advancing={reviewAdvancing}
            reverting={reviewReverting}
            onAdvance={handleAdvanceReviewClick}
            onRevert={() => void handleRevertReview()}
          />
        )}

        <CompleteReviewPayslipsDialog
          open={thirdReviewConfirmOpen}
          onOpenChange={setThirdReviewConfirmOpen}
          periodLabel={`${period.nameAr} (${period.code})`}
          employeeCount={payrollSummary?.employeesCount ?? previews.length}
          busy={reviewAdvancing}
          onConfirm={() => void handleConfirmThirdReviewAndGenerate()}
        />

        {/* ══ COLUMN TOGGLES + PUSH FROM ATTENDANCE ══ */}
        {!embedded && hasLines && (
          <>
            <CompensationDataToolbar
              cols={cols}
              isReviewLocked={isReviewLocked}
              togglingCol={togglingCol}
              pushing={pushing}
              onToggleCol={toggleCol}
              onPushAttendance={() => setPushDialogOpen(true)}
              onPushAdvances={() => setAdvancesPushDialogOpen(true)}
              onPushViolations={() => setViolationsPushDialogOpen(true)}
            />

            <PushFromAttendanceDialog
              open={pushDialogOpen}
              onOpenChange={setPushDialogOpen}
              pushing={pushing}
              disabled={isReviewLocked}
              onConfirm={options => void handlePushFromAttendance(options)}
            />

            <PushFromAdvancesDialog
              open={advancesPushDialogOpen}
              onOpenChange={setAdvancesPushDialogOpen}
              pushing={pushing}
              disabled={isReviewLocked}
              employees={pushDialogEmployees}
              defaultEmployeeIds={employeeIdsFilter}
              onConfirm={options => void handlePushFromAdvances(options)}
            />

            <PushFromViolationsDialog
              open={violationsPushDialogOpen}
              onOpenChange={setViolationsPushDialogOpen}
              pushing={pushing}
              disabled={isReviewLocked}
              employees={pushDialogEmployees}
              defaultEmployeeIds={employeeIdsFilter}
              onConfirm={options => void handlePushFromViolations(options)}
            />

            <CompensationIncrementAdjustDialog
              open={adjustDialog !== null}
              context={adjustDialog}
              submitting={adjustSubmitting}
              onConfirm={(payload) => void handleIncrementAdjustConfirm(payload)}
              onCancel={() => { if (!adjustSubmitting) setAdjustDialog(null); }}
            />
          </>
        )}

        {/* ══ TABLE / EMPTY STATE ══ */}
        {!hasLines ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">لا توجد سجلات تشغيل</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              لا يوجد موظفون بعقود نشطة أو مدخلات راتب في هذه الفترة.
            </p>
          </div>
        ) : previews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">لا توجد نتائج</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {filterActive
                ? 'لا يوجد موظفون مطابقون لتصفية الموظفين الحالية. غيّر التصفية أو اختر «جميع الموظفين».'
                : 'تعذر عرض صفوف التقرير لهذه الفترة.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
            <div className="overflow-x-auto">
              <table className={cn('w-full border-collapse text-[11.5px]', embedded ? 'min-w-[1080px]' : 'min-w-[860px]')}>
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-gradient-to-b from-muted/80 to-muted/50 backdrop-blur-sm text-muted-foreground">
                    <th className="w-9 border-e border-border/60 px-2 py-3 text-center font-semibold">#</th>
                    <th className="min-w-[9.5rem] border-e border-border/60 px-3 py-3 text-right font-semibold">الموظف</th>
                    <th className="min-w-[11rem] border-e border-border/60 px-3 py-3 text-right font-semibold">البدلات (شهري)</th>
                    <th className="min-w-[5.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">الراتب الأساسي</th>
                    {tableCols.colOvertime && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">أوفر تايم</th>}
                    {tableCols.colBonus && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مكافآت</th>}
                    {embedded && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">الإجمالي</th>}
                    {tableCols.colDedAdvances && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">السلف</th>}
                    {tableCols.colDedAbsence && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-warning">غياب</th>}
                    {tableCols.colDedLate && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">تأخير</th>}
                    {tableCols.colDedPenalties && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">جزاءات</th>}
                    {tableCols.colDedAdmin && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">إضافة/خصم مباشر</th>}
                    <th className="min-w-[6rem] bg-primary/6 px-3 py-3 text-center font-bold text-primary">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((row, i) => (
                      <tr
                        key={row.lineId}
                        className="group border-b border-border/50 last:border-0 even:bg-muted/15 hover:bg-primary/4 transition-colors duration-150"
                      >
                        <td className="border-e border-border/40 px-2 py-2 text-center font-mono text-[10px] text-muted-foreground tabular-nums">
                          {fmt(i + 1, 0)}
                        </td>
                        <td className="border-e border-border/40 px-3 py-2 text-right">
                          <span className="font-semibold text-foreground">{row.namePrimary}</span>
                        </td>
                        <AllowancesBreakdownCell row={row} />
                        <td className="border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                          {fmt(row.baseSalary)}
                        </td>
                        {tableCols.colOvertime && <ReadOnlyAmountCell amount={row.entitlementOvertimeSar} colorClass="text-primary" />}
                        {tableCols.colBonus && (
                          embedded ? (
                            <ReadOnlyAmountCell amount={row.entitlementBonusSar} colorClass="text-primary" />
                          ) : (
                            <AdjustableAmountCell
                              amount={row.entitlementBonusSar}
                              colorClass="text-primary"
                              disabled={isReviewLocked}
                              onEditClick={() => openAdjustDialog(row, 'bonus')}
                            />
                          )
                        )}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                            {fmt(row.grossSar)}
                          </td>
                        )}
                        {tableCols.colDedAdvances && <ReadOnlyAmountCell amount={row.dedAdvancesSar} colorClass="text-destructive" />}
                        {tableCols.colDedAbsence && <ReadOnlyAmountCell amount={row.dedAbsenceSar} colorClass="text-warning" />}
                        {tableCols.colDedLate && <ReadOnlyAmountCell amount={row.dedLateSar} colorClass="text-destructive" />}
                        {tableCols.colDedPenalties && <ReadOnlyAmountCell amount={row.dedPenaltiesSar} colorClass="text-destructive" />}
                        {tableCols.colDedAdmin && (
                          embedded ? (
                            <ReadOnlyAmountCell
                              amount={row.dedAdminSar}
                              colorClass={
                                row.dedAdminSar > 0
                                  ? 'text-primary'
                                  : row.dedAdminSar < 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                              }
                            />
                          ) : (
                            <AdjustableAmountCell
                              amount={row.dedAdminSar}
                              colorClass={
                                row.dedAdminSar > 0
                                  ? 'text-primary'
                                  : row.dedAdminSar < 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                              }
                              disabled={isReviewLocked}
                              onEditClick={() => openAdjustDialog(row, 'admin')}
                            />
                          )
                        )}
                        <td className={cn(
                          'bg-primary/5 px-3 py-2 text-center font-mono font-bold tabular-nums',
                          row.lineNetSar < 0 ? 'text-destructive' : 'text-foreground',
                        )}>
                          {fmt(row.lineNetSar)}
                        </td>
                      </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-gradient-to-b from-primary/6 to-primary/3 font-bold text-[11.5px]">
                    <td colSpan={3} className="border-e border-border/60 px-3 py-3 text-right text-xs font-bold text-primary">
                      المجموع الكلي
                    </td>
                    <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">
                      {fmt(footerTotals?.baseSalary ?? 0)}
                    </td>
                    {tableCols.colOvertime && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(footerTotals?.overtime ?? 0)}</td>}
                    {tableCols.colBonus && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(footerTotals?.bonuses ?? 0)}</td>}
                    {embedded && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">{fmt(footerTotals?.gross ?? 0)}</td>}
                    {tableCols.colDedAdvances && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(footerTotals?.advances ?? 0)}</td>}
                    {tableCols.colDedAbsence && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-warning">{fmt(footerTotals?.absence ?? 0)}</td>}
                    {tableCols.colDedLate && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(footerTotals?.lateness ?? 0)}</td>}
                    {tableCols.colDedPenalties && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(footerTotals?.penalties ?? 0)}</td>}
                    {tableCols.colDedAdmin && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">{fmt(footerTotals?.manualAdminSigned ?? 0)}</td>}
                    <td className={cn(
                      'bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm',
                      (footerTotals?.net ?? 0) < 0 ? 'text-destructive' : 'text-primary',
                    )}>
                      {fmt(footerTotals?.net ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

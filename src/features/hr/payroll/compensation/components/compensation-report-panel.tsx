'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Loader2,
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
import {
  deliveryIncludesPayslipNotify,
  deliveryIncludesPdfSign,
  sendCashReceiptSignatureNotification,
  sendPayslipGeneratedNotification,
} from '@/features/hr/payroll/compensation/services/payslip-notification.service';
import { cashReceiptVouchersApi } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import type { PayrollNotifyDeliveryMode } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { payslipsApi } from '@/features/hr/payroll/lib/api/payslips';
import { CompensationPeriodExportActions } from '@/features/hr/payroll/compensation/components/compensation-period-export-actions';
import { CompensationCellDetailDialog } from '@/features/hr/payroll/compensation/components/compensation-cell-detail-dialog';
import {
  type CompensationCellDetailContext,
  type CompensationDetailField,
} from '@/features/hr/payroll/compensation/lib/compensation-cell-detail';

function ReadOnlyAmountCell({
  amount,
  colorClass,
  onOpenDetail,
}: {
  amount: number;
  colorClass?: string;
  onOpenDetail?: () => void;
}) {
  return (
    <td
      className={cn(
        'border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-[11.5px]',
        onOpenDetail && 'cursor-pointer select-none',
      )}
      onDoubleClick={onOpenDetail}
      title={onOpenDetail ? 'انقر مرتين لعرض التفاصيل' : undefined}
    >
      <span className={colorClass}>{formatLatinNumber(amount)}</span>
    </td>
  );
}

function AllowancesBreakdownCell({
  row,
  onOpenDetail,
}: {
  row: PayrollLineCompensationPreview;
  onOpenDetail?: () => void;
}) {
  return (
    <td
      className={cn(
        'border-e border-border/40 px-3 py-2 text-right',
        onOpenDetail && 'cursor-pointer select-none',
      )}
      onDoubleClick={onOpenDetail}
      title={onOpenDetail ? 'انقر مرتين لعرض التفاصيل' : undefined}
    >
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

const COMPENSATION_TABLE_HEADER_CELL =
  'sticky top-0 z-30 border-e border-border/60 bg-muted px-3 py-3';

const COMPENSATION_TABLE_HEADER_ROW =
  'border-b border-border bg-muted text-muted-foreground compensation-table-header-row-shadow';

// No overflow wrapper here on purpose: scrolling (both axes) is owned by the
// single ancestor set up in the render body below, so `position: sticky` on
// thead binds to that one real scroll container instead of a second,
// non-scrolling scroll-container ancestor (which would trap the sticky
// calculation and stop the header from catching at the top).
function CompensationTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border shadow-elevated animate-fade-in">
      {children}
    </div>
  );
}

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
  const [togglingCol, setTogglingCol] = React.useState<keyof CompensationColumnVisibility | null>(null);
  const [adjustDialog, setAdjustDialog] = React.useState<IncrementAdjustDialogContext | null>(null);
  const [adjustSubmitting, setAdjustSubmitting] = React.useState(false);
  const [cellDetailContext, setCellDetailContext] = React.useState<CompensationCellDetailContext | null>(null);
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

  const openCellDetail = React.useCallback((
    row: PayrollLineCompensationPreview,
    field: CompensationDetailField,
  ) => {
    if (embedded || !companyId || !periodId || !period || !payrollSummary) return;
    setCellDetailContext({
      periodId,
      companyId,
      currency: payrollSummary.currency ?? 'SAR',
      periodStartDate: payrollSummary.startDate,
      periodEndDate: payrollSummary.endDate,
      row,
      field,
    });
  }, [embedded, companyId, periodId, period, payrollSummary]);

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

  const handleConfirmThirdReviewAndGenerate = async (
    deliveryMode: PayrollNotifyDeliveryMode,
  ) => {
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
      // Only this explicit /notifications send — generate and advance stay silent.
      const employeeIds = created.length > 0
        ? created.map((p) => p.employeeId)
        : periodEmployeeIds;

      const uniqueEmployeeIds = [...new Set(employeeIds.filter(Boolean))];
      let notificationParts: string[] = [];

      if (companyId && uniqueEmployeeIds.length > 0) {
        if (deliveryIncludesPdfSign(deliveryMode)) {
          try {
            const bulk = await cashReceiptVouchersApi.bulkIssueForPayroll({
              companyId,
              payrollPeriodId: period.id,
              employeeIds: uniqueEmployeeIds,
              createdBy: actor,
            });
            await sendCashReceiptSignatureNotification({
              companyId,
              periodId: period.id,
              periodNameAr: period.nameAr,
              employeeIds: uniqueEmployeeIds,
              createdBy: actor,
            });
            notificationParts.push(
              `سند راتب: ${bulk.created} سنداً` +
                (bulk.skipped > 0 ? ` (تخطّي ${bulk.skipped})` : ''),
            );
          } catch (pdfErr) {
            const { displayMessage } = handleApiError(
              pdfErr,
              'compensation.cash-receipt-signature',
            );
            toast.error(`تم إنشاء القسائم لكن فشل سند الراتب/إشعاره: ${displayMessage}`);
          }
        }

        if (deliveryIncludesPayslipNotify(deliveryMode)) {
          try {
            await sendPayslipGeneratedNotification({
              companyId,
              periodId: period.id,
              periodNameAr: period.nameAr,
              employeeIds: uniqueEmployeeIds,
              createdBy: actor,
            });
            notificationParts.push(`إشعار قسيمة إلى ${uniqueEmployeeIds.length} موظفاً`);
          } catch (notifErr) {
            const { displayMessage } = handleApiError(
              notifErr,
              'compensation.payslip-notification',
            );
            toast.error(`تم إنشاء القسائم لكن فشل إرسال إشعار القسيمة: ${displayMessage}`);
          }
        }
      }

      setThirdReviewConfirmOpen(false);
      const payslipMessage = created.length > 0
        ? `تم إتمام المراجعة الثالثة وإنشاء ${created.length} قسيمة مسودة.`
        : 'تم إتمام المراجعة الثالثة — لم يُنشأ أي قسيمة جديدة (قد تكون موجودة مسبقاً).';
      const notificationMessage =
        notificationParts.length > 0 ? ` ${notificationParts.join(' · ')}.` : '';
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
        `تم دفع السلف: ${result.inputsCreated} مدخل جديد، ${result.inputsDeleted} محذوف، ${result.advancesProcessed} سلفة، إجمالي ${result.totalDeducted}.`,
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
        `تم دفع الجزاءات: ${result.inputsCreated} مدخل جديد، ${result.inputsDeleted} محذوف، ${result.violationsProcessed} مخالفة، إجمالي ${result.totalDeducted}.`,
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

      <div className={cn(
        'flex min-h-0 flex-1 flex-col transition-opacity duration-500',
        mounted ? 'opacity-100' : 'opacity-0',
      )}>

        {/*
          Single scroll container for chrome + table. Chrome scrolls away
          normally as the user scrolls down; once the table's thead reaches
          the top of this box it sticks there (position: sticky binds to the
          nearest ancestor scroll container — keeping chrome and table in the
          SAME container, instead of a separate fixed area above a boxed
          table, is what makes the header "catch" instead of the whole table
          living in its own mini scroll pane).
        */}
        <div className="min-h-0 flex-1 overflow-auto">
        <div className="space-y-5">
          {/* ══ BACK BUTTON ══ */}
          {!embedded && (
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
              {backBtn}
              {hasLines && previews.length > 0 && (
                <CompensationPeriodExportActions
                  periodId={periodId}
                  employeeIdsFilter={employeeIdsFilter}
                />
              )}
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
            onConfirm={(mode) => void handleConfirmThirdReviewAndGenerate(mode)}
          />

          {!embedded && (
            <CompensationCellDetailDialog
              context={cellDetailContext}
              open={cellDetailContext !== null}
              onOpenChange={(open) => { if (!open) setCellDetailContext(null); }}
            />
          )}

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
          <CompensationTableShell>
                <table className={cn('w-full border-separate border-spacing-0 text-[11.5px]', embedded ? 'min-w-[1080px]' : 'min-w-[860px]')}>
                <thead>
                  <tr className={COMPENSATION_TABLE_HEADER_ROW}>
                    <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'w-9 px-2 text-center font-semibold')}>#</th>
                    <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[9.5rem] text-right font-semibold')}>الموظف</th>
                    <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[11rem] text-right font-semibold')}>البدلات (شهري)</th>
                    <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[5.5rem] text-center font-semibold')}>الراتب الأساسي</th>
                    {tableCols.colOvertime && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[5rem] text-center font-semibold text-primary/80')}>أوفر تايم</th>}
                    {tableCols.colBonus && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold text-primary/80')}>مكافآت</th>}
                    {embedded && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[5rem] text-center font-semibold')}>الإجمالي</th>}
                    {tableCols.colDedAdvances && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold text-destructive')}>السلف</th>}
                    {tableCols.colDedAbsence && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold text-warning')}>غياب</th>}
                    {tableCols.colDedLate && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold text-destructive')}>تأخير</th>}
                    {tableCols.colDedPenalties && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold text-destructive')}>جزاءات</th>}
                    {tableCols.colDedAdmin && <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[4.5rem] text-center font-semibold')}>إضافة/خصم مباشر</th>}
                    <th className={cn(COMPENSATION_TABLE_HEADER_CELL, 'min-w-[6rem] text-center font-bold text-primary')}>الصافي</th>
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
                        <AllowancesBreakdownCell
                          row={row}
                          onOpenDetail={!embedded ? () => openCellDetail(row, 'allowances') : undefined}
                        />
                        <td
                          className={cn(
                            'border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums',
                            !embedded && 'cursor-pointer select-none',
                          )}
                          onDoubleClick={!embedded ? () => openCellDetail(row, 'baseSalary') : undefined}
                          title={!embedded ? 'انقر مرتين لعرض التفاصيل' : undefined}
                        >
                          {fmt(row.baseSalary)}
                        </td>
                        {tableCols.colOvertime && (
                          <ReadOnlyAmountCell
                            amount={row.entitlementOvertimeSar}
                            colorClass="text-primary"
                            onOpenDetail={!embedded ? () => openCellDetail(row, 'overtime') : undefined}
                          />
                        )}
                        {tableCols.colBonus && (
                          embedded ? (
                            <ReadOnlyAmountCell amount={row.entitlementBonusSar} colorClass="text-primary" />
                          ) : (
                            <AdjustableAmountCell
                              amount={row.entitlementBonusSar}
                              colorClass="text-primary"
                              disabled={isReviewLocked}
                              onEditClick={() => openAdjustDialog(row, 'bonus')}
                              onDoubleClick={() => openCellDetail(row, 'bonus')}
                            />
                          )
                        )}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                            {fmt(row.grossSar)}
                          </td>
                        )}
                        {tableCols.colDedAdvances && (
                          <ReadOnlyAmountCell
                            amount={row.dedAdvancesSar}
                            colorClass="text-destructive"
                            onOpenDetail={!embedded ? () => openCellDetail(row, 'advances') : undefined}
                          />
                        )}
                        {tableCols.colDedAbsence && (
                          <ReadOnlyAmountCell
                            amount={row.dedAbsenceSar}
                            colorClass="text-warning"
                            onOpenDetail={!embedded ? () => openCellDetail(row, 'absence') : undefined}
                          />
                        )}
                        {tableCols.colDedLate && (
                          <ReadOnlyAmountCell
                            amount={row.dedLateSar}
                            colorClass="text-destructive"
                            onOpenDetail={!embedded ? () => openCellDetail(row, 'lateness') : undefined}
                          />
                        )}
                        {tableCols.colDedPenalties && (
                          <ReadOnlyAmountCell
                            amount={row.dedPenaltiesSar}
                            colorClass="text-destructive"
                            onOpenDetail={!embedded ? () => openCellDetail(row, 'penalties') : undefined}
                          />
                        )}
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
                              onDoubleClick={() => openCellDetail(row, 'admin')}
                            />
                          )
                        )}
                        <td
                          className={cn(
                            'bg-primary/5 px-3 py-2 text-center font-mono font-bold tabular-nums',
                            row.lineNetSar < 0 ? 'text-destructive' : 'text-foreground',
                            !embedded && 'cursor-pointer select-none',
                          )}
                          onDoubleClick={!embedded ? () => openCellDetail(row, 'net') : undefined}
                          title={!embedded ? 'انقر مرتين لعرض التفاصيل' : undefined}
                        >
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
          </CompensationTableShell>
        )}
        </div>
        </div>

      </div>
    </>
  );
}

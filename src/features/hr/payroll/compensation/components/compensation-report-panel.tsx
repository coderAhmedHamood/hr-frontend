'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Banknote, Check, FileSpreadsheet, FileText, Gavel, Loader2,
  Users, Pencil,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { cn } from '@/shared/utils';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_COLORS,
  REVIEW_STAGE_LABELS,
  buildAdminDirectInputNote,
  type HRPayrollPeriodRecord,
  type HRPayrollMonthlyInput,
  type HRPayrollMonthlyInputKind,
  type HRPayrollReviewStage,
} from '@/features/hr/payroll/lib/payroll-periods-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import {
  buildCompensationPreviews, formatLatinNumber,
  parseOptionalPositiveRate,
  lineNetFromEditRow,
  editAmount,
  editSignedAmount,
  editValuesEqual,
  type CompensationColumnVisibility,
  type CompensationEditValues,
  type CompensationAdvancesPushOptions,
  type CompensationViolationsPushOptions,
  type CompensationPushOptions,
  type PayrollLineCompensationPreview,
  periodToColumnVisibility,
  COLUMN_TO_PERIOD_INCLUDE,
  DEFAULT_COMPENSATION_COLUMN_VISIBILITY,
} from '@/features/hr/payroll/lib/compensation-preview';
import { hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId, useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { employeeAdvancesApi } from '@/features/hr/contracts/lib/api/employee-advances';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { PushFromAttendanceDialog } from '@/features/hr/payroll/compensation/components/push-from-attendance-dialog';
import { PushFromAdvancesDialog } from '@/features/hr/payroll/compensation/components/push-from-advances-dialog';
import { PushFromViolationsDialog } from '@/features/hr/payroll/compensation/components/push-from-violations-dialog';
import { CompensationEditConfirmDialog } from '@/features/hr/payroll/compensation/components/compensation-edit-confirm-dialog';
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
import { DirectoryPagedViews } from '@/components/ui/paged-list';

const EDIT_FIELD_LABELS: Record<keyof CompensationEditValues, string> = {
  overtime: 'أوفر تايم',
  bonus: 'مكافآت',
  absenceSar: 'غياب',
  late: 'تأخير',
  penalties: 'جزاءات',
  advances: 'السلف',
  admin: 'خصم او اضافة مباشرة',
};

/* ── Inline-edit cell ──────────────────────────────────────────────────────── */
type EditRow = CompensationEditValues;

function rowToEdits(row: PayrollLineCompensationPreview): EditRow {
  return {
    overtime:   String(row.entitlementOvertimeSar),
    bonus:      String(row.entitlementBonusSar),
    absenceSar: String(row.dedAbsenceSar),
    late:       String(row.dedLateSar),
    penalties:  String(row.dedPenaltiesSar),
    advances:   String(row.dedAdvancesSar),
    admin:      String(row.dedAdminSar),
  };
}

function ReadOnlyAmountCell({ amount, colorClass }: { amount: number; colorClass?: string }) {
  return (
    <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-[11.5px]">
      <span className={colorClass}>{formatLatinNumber(amount)}</span>
    </td>
  );
}

const EDITABLE_FIELDS = new Set<keyof EditRow>(['bonus', 'admin']);

function EditCell({
  value, baseline, onChange, onAttemptCommit, colorClass, disabled, allowNegative = false,
}: {
  value: string;
  baseline: string;
  onChange: (v: string) => void;
  onAttemptCommit: (previousValue: string, newValue: string) => void;
  colorClass?: string;
  disabled?: boolean;
  allowNegative?: boolean;
}) {
  const skipBlurCommit = React.useRef(false);

  const commit = (input: HTMLInputElement) => {
    onAttemptCommit(baseline, input.value);
  };

  return (
    <div className="relative flex items-center justify-center">
      <input
        type="number"
        {...(allowNegative ? {} : { min: 0 })}
        step="any"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={e => {
          if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
          }
          commit(e.target as HTMLInputElement);
        }}
        onKeyDown={e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          e.stopPropagation();
          skipBlurCommit.current = true;
          commit(e.target as HTMLInputElement);
          (e.target as HTMLInputElement).blur();
        }}
        className={cn(
          'w-22 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-center font-mono tabular-nums text-[11.5px] transition-all duration-150',
          'hover:border-border focus:border-primary/50 focus:bg-primary/5 focus:outline-none focus:ring-0',
          disabled ? 'pointer-events-none opacity-50' : 'cursor-text',
          colorClass,
        )}
      />
      {!disabled && (
        <Pencil className="absolute inset-e-0.5 top-0.5 h-2.5 w-2.5 text-muted-foreground/30 pointer-events-none" />
      )}
    </div>
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
  const periods               = useHRPayrollPeriodsStore(s => s.periods);
  const periodsLoading        = useHRPayrollPeriodsStore(s => s.isLoading);
  const fetchPeriods          = useHRPayrollPeriodsStore(s => s.fetch);
  const ensurePeriodLoaded    = useHRPayrollPeriodsStore(s => s.ensurePeriodLoaded);
  const materialize           = useHRPayrollPeriodsStore(s => s.materializeFromContracts);
  const advanceReview           = useHRPayrollPeriodsStore(s => s.advanceReview);
  const revertReview            = useHRPayrollPeriodsStore(s => s.revertReview);
  const setMonthlyInputs      = useHRPayrollPeriodsStore(s => s.setMonthlyInputs);
  const updatePeriod          = useHRPayrollPeriodsStore(s => s.update);
  const refreshMonthlyInputs  = useHRPayrollPeriodsStore(s => s.refreshMonthlyInputsForPeriod);
  const contracts             = useHRContractsStore(s => s.contracts);
  const contractsLoading      = useHRContractsStore(s => s.isLoading);
  const fetchContracts        = useHRContractsStore(s => s.fetch);
  const allowanceTypes        = useHRAllowanceTypesStore(s => s.items);
  const fetchAllowanceTypes   = useHRAllowanceTypesStore(s => s.fetch);
  const allEmployees          = useHREmployeeDirectoryStore(s => s.employees);
  const fetchEmployees        = useHREmployeeDirectoryStore(s => s.fetch);
  const [bootstrapping, setBootstrapping] = React.useState(true);

  // Load payroll context once when company + period are known (avoid refetch loops).
  React.useEffect(() => {
    if (!companyId || !periodId) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    setBootstrapping(true);

    void (async () => {
      try {
        const periodsState = useHRPayrollPeriodsStore.getState();
        const contractsState = useHRContractsStore.getState();
        const hasPeriod = periodsState.periods.some((p) => p.id === periodId);
        const pending: Promise<void>[] = [];

        if (!hasPeriod && !periodsState.isLoading) {
          pending.push(fetchPeriods());
        }
        if (contractsState.contracts.length === 0 && !contractsState.isLoading) {
          pending.push(fetchContracts({}));
        }
        if (pending.length > 0) {
          await Promise.all(pending);
        }
        if (cancelled) return;

        const stillMissing = !useHRPayrollPeriodsStore.getState().periods.some((p) => p.id === periodId);
        if (stillMissing) {
          await ensurePeriodLoaded(periodId);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    const allowanceState = useHRAllowanceTypesStore.getState();
    if (allowanceState.items.length === 0 && !allowanceState.isLoading) {
      void fetchAllowanceTypes();
    }

    const employeesState = useHREmployeeDirectoryStore.getState();
    if (employeesState.employees.length === 0 && !employeesState.isLoading) {
      void fetchEmployees();
    }

    return () => { cancelled = true; };
  }, [companyId, periodId, fetchPeriods, fetchContracts, ensurePeriodLoaded, fetchAllowanceTypes, fetchEmployees]);

  const targetPeriod = periods.find((p) => p.id === periodId);
  const needsMaterialize = Boolean(
    targetPeriod && (targetPeriod.employmentLines?.length ?? 0) === 0,
  );

  React.useEffect(() => {
    if (!needsMaterialize || contracts.length === 0) return;
    materialize(contracts);
  }, [needsMaterialize, contracts, materialize]);

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
  const [edits, setEdits] = React.useState<Record<string, EditRow>>({});
  const savedBaselines = React.useRef<Record<string, EditRow>>({});
  const [pendingEdit, setPendingEdit] = React.useState<{
    lineId: string;
    employeeName: string;
    field: keyof EditRow;
    fieldLabel: string;
    previousValue: string;
    newValue: string;
    baseSalary: number;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const raw    = periods.find(p => p.id === periodId);
  const period = React.useMemo(() => raw ? normalizePeriod(raw) : null, [raw]);

  const cols = React.useMemo(
    () => (period ? periodToColumnVisibility(period) : DEFAULT_COMPENSATION_COLUMN_VISIBILITY),
    [period],
  );

  const getContract = React.useCallback((id: string) => contracts.find(c => c.id === id),    [contracts]);
  const getAlloType  = React.useCallback((id: string) => allowanceTypes.find(a => a.id === id), [allowanceTypes]);

  const filterKey = employeeIdsFilter?.length ? [...employeeIdsFilter].sort().join(',') : '';
  const previews = React.useMemo(() => {
    if (!period) return [];
    let list = buildCompensationPreviews(period, getContract, getAlloType);
    if (filterKey) {
      const allow = new Set(filterKey.split(','));
      list = list.filter(r => allow.has(r.employeeId));
    }
    return list;
  }, [period, getContract, getAlloType, filterKey]);

  /** All company employees for payroll push dialogs — not limited to period lines. */
  const pushDialogEmployees = React.useMemo(
    () => allEmployees.map(e => ({
      id: e.id,
      name: e.nameAr?.trim() || e.nameEn?.trim() || e.bridgeId || '—',
    })),
    [allEmployees],
  );

  /* ── sync edit state from previews ── */
  React.useEffect(() => {
    const next = Object.fromEntries(previews.map(row => [row.lineId, rowToEdits(row)]));
    setEdits(next);
    savedBaselines.current = next;
  }, [previews]);

  const handleChange = (lineId: string, field: keyof EditRow, val: string) =>
    setEdits(e => ({ ...e, [lineId]: { ...e[lineId], [field]: val } }));

  const handleSave = React.useCallback((
    lineId: string,
    baseSalary: number,
    editedField?: keyof EditRow,
    fieldNotes?: string,
  ) => {
    const editRow = edits[lineId];
    const row = previews.find(r => r.lineId === lineId);
    if (!editRow || !period || !row) return;
    const locked = rowToEdits(row);
    const existingInputs = period.employmentLineMonthlyInputs[lineId] ?? [];
    const existingNote = (kind: HRPayrollMonthlyInputKind) =>
      existingInputs.find(i => i.kind === kind)?.note ?? '';

    const p = (s: string) => Math.max(0, parseFloat(s) || 0);
    const signed = (s: string) => {
      const n = parseFloat(s);
      return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    };
    const overtime   = p(locked.overtime);
    const bonus      = p(editRow.bonus);
    const absenceSar = p(locked.absenceSar);
    const late       = p(locked.late);
    const penalties  = p(locked.penalties);
    const advances   = p(locked.advances);
    const admin      = signed(editRow.admin);

    const bonusNote = editedField === 'bonus'
      ? (fieldNotes?.trim() ?? '')
      : existingNote('allowance_amount');
    const adminNote = editedField === 'admin'
      ? buildAdminDirectInputNote(fieldNotes)
      : (existingNote('other') || buildAdminDirectInputNote());

    const dailyRate   = baseSalary / 30;
    const absenceDays = dailyRate > 0 ? Math.round((absenceSar / dailyRate) * 1000) / 1000 : 0;

    const inputs: HRPayrollMonthlyInput[] = [
      ...(overtime    > 0 ? [{ kind: 'overtime_hours'    as const, value: overtime,    note: existingNote('overtime_hours') }] : []),
      ...(bonus       > 0 ? [{ kind: 'allowance_amount'  as const, value: bonus,       note: bonusNote }] : []),
      ...(absenceDays > 0 ? [{ kind: 'absence_days'      as const, value: absenceDays, note: existingNote('absence_days') }] : []),
      ...(late        > 0 ? [{ kind: 'late_minutes'      as const, value: late,        note: existingNote('late_minutes') }] : []),
      ...(penalties   > 0 ? [{ kind: 'deduction_amount'  as const, value: penalties,   note: existingNote('deduction_amount') }] : []),
      ...(advances    > 0 ? [{ kind: 'advance_recovery'  as const, value: advances,    note: existingNote('advance_recovery') }] : []),
      ...(admin       !== 0 ? [{ kind: 'other'             as const, value: admin,        note: adminNote }] : []),
    ];

    setMonthlyInputs(periodId, lineId, inputs);
    savedBaselines.current[lineId] = { ...locked, bonus: editRow.bonus, admin: editRow.admin };
  }, [edits, period, periodId, previews, setMonthlyInputs]);

  const exportLines = React.useMemo(
    () => (period ? buildCompensationExportLines(period, previews, edits, cols) : []),
    [period, previews, edits, cols],
  );

  const payrollPrintData = React.useMemo(
    () => (period && exportLines.length > 0 ? buildCompensationPrintPayload(period, exportLines, cols) : null),
    [period, exportLines, cols],
  );

  const attemptEditCommit = (
    lineId: string,
    field: keyof EditRow,
    employeeName: string,
    baseSalary: number,
    previousValue: string,
    newValue: string,
  ) => {
    if (!EDITABLE_FIELDS.has(field)) return;
    if (editValuesEqual(previousValue, newValue)) return;
    if (pendingEdit) return;
    // Defer past Enter key so it cannot activate the dialog confirm button.
    window.setTimeout(() => {
      setPendingEdit({
        lineId,
        employeeName,
        field,
        fieldLabel: EDIT_FIELD_LABELS[field],
        previousValue,
        newValue,
        baseSalary,
      });
    }, 50);
  };

  const confirmPendingEdit = (notes: string) => {
    if (!pendingEdit) return;
    handleSave(pendingEdit.lineId, pendingEdit.baseSalary, pendingEdit.field, notes);
    setPendingEdit(null);
  };

  const cancelPendingEdit = () => {
    if (!pendingEdit) return;
    const { lineId, field, previousValue } = pendingEdit;
    setEdits(e => ({
      ...e,
      [lineId]: { ...e[lineId], [field]: previousValue },
    }));
    setPendingEdit(null);
  };

  const fmt = (n: number, f = 2) => formatLatinNumber(n, f);
  const backHref = hrPayrollRoutes.payrollPeriods;

  const backBtn = (
    <Link
      href={backHref}
      className="group inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground/70 shadow-soft transition-all hover:border-primary/30 hover:bg-accent hover:text-primary"
    >
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      العودة إلى فترات الراتب
    </Link>
  );

  const isResolvingPeriod = Boolean(
    periodId && (
      !companyId
      || periodsLoading
      || contractsLoading
      || (bootstrapping && !raw)
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

  const hasLines  = period.employmentLines.length > 0;
  const filterActive = Boolean(filterKey);
  const isReviewLocked = period.isReviewCompleted;

  /* ── Aggregate totals ── */
  const totalBase  = previews.reduce((s, r) => s + r.baseSalary, 0);
  const totalAllowances = previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0);
  const totalEntitlements = previews.reduce((s, r) => s + r.entitlementOvertimeSar + r.entitlementBonusSar, 0);
  const totalDed   = previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar + r.dedAdvancesSar + (r.dedAdminSar < 0 ? -r.dedAdminSar : 0), 0);
  const totalNet = previews.reduce((s, r) => {
    const e = edits[r.lineId] ?? rowToEdits(r);
    const netEdit: CompensationEditValues = { ...rowToEdits(r), bonus: e.bonus, admin: e.admin };
    return s + lineNetFromEditRow(r.baseSalary, r.allowancesMonthlyTotal, netEdit, cols);
  }, 0);

  const sumEditField = (field: keyof EditRow) =>
    previews.reduce((s, r) => {
      const raw = (edits[r.lineId] ?? rowToEdits(r))[field];
      return s + (field === 'admin' ? editSignedAmount(raw) : editAmount(raw));
    }, 0);

  const sumPreviewField = (pick: (r: PayrollLineCompensationPreview) => number) =>
    previews.reduce((s, r) => s + pick(r), 0);
  const totalDedNoAdmin = previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar + r.dedAdvancesSar, 0);
  const totalNetSar   = previews.reduce((s, r) => s + r.lineNetSar, 0);

  const handleDownloadExcel = async () => {
    if (!hasLines || exportLines.length === 0) {
      toast.error('لا توجد بيانات للتصدير.');
      return;
    }
    setExcelExporting(true);
    try {
      await downloadCompensationExcel(period, exportLines, cols);
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
      const actor = useAuthStore.getState().user?.email ?? undefined;
      const companyId = getDefaultCompanyId() ?? '';
      const created = await payslipsApi.generate({
        payrollPeriodId: period.id,
        generatedBy: actor,
      });
      const employeeIds = created.length > 0
        ? created.map((p) => p.employeeId)
        : period.employmentLines.map((l) => l.employeeId);

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
      const updated = useHRPayrollPeriodsStore.getState().periods.find(p => p.id === period.id);
      toast.success(
        updated?.isReviewCompleted
          ? 'تم التراجع — الفترة الآن تحت المراجعة الثالثة'
          : updated
            ? `تم التراجع — الفترة الآن تحت ${REVIEW_STAGE_LABELS[updated.reviewStage]}`
            : 'تم التراجع عن آخر مرحلة مراجعة.',
      );
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
      : period.employmentLines.map(l => l.employeeId);

    const absenceOverride = parseOptionalPositiveRate(pushOptions.absenceDailyRateOverride);
    const lateOverride = parseOptionalPositiveRate(pushOptions.lateMinuteRateOverride);
    const overtimeMultiplier = parseOptionalPositiveRate(pushOptions.overtimeMultiplier) ?? 1.5;
    const createdBy = useAuthStore.getState().user?.email ?? undefined;

    setPushing(true);
    try {
      const result = await attendanceDaySummariesApi.pushToPayroll({
        payrollPeriodId: period.id,
        employeeIds,
        replaceExisting: pushOptions.replaceExisting,
        applyOvertime: pushOptions.applyOvertime,
        applyAbsence: pushOptions.applyAbsence,
        applyLateness: pushOptions.applyLateness,
        ...(absenceOverride !== undefined ? { absenceDailyRateOverride: absenceOverride } : {}),
        ...(lateOverride !== undefined ? { lateMinuteRateOverride: lateOverride } : {}),
        overtimeMultiplier,
        createdBy,
      });

      await refreshMonthlyInputs(period.id);
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

      await refreshMonthlyInputs(period.id);
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

      await refreshMonthlyInputs(period.id);
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
      })
      .finally(() => setTogglingCol(null));
  };

  return (
    <>
      {!embedded && <SetPageTitle titleAr={`تقرير المستحقات — ${period.nameAr || period.code}`} iconName="CalendarRange" />}

      <div className={cn('space-y-5 overflow-x-hidden transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}>

        {/* ══ BACK BUTTON ══ */}
        {!embedded && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {backBtn}
            {hasLines && previews.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs"
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
                  className="h-9 gap-1.5 text-xs"
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
          employeeCount={period.employmentLines.length}
          busy={reviewAdvancing}
          onConfirm={() => void handleConfirmThirdReviewAndGenerate()}
        />

        {/* ══ COLUMN TOGGLES + PUSH FROM ATTENDANCE ══ */}
        {!embedded && hasLines && (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-soft animate-fade-in">
              <span className="text-xs font-semibold text-muted-foreground">إظهار الأعمدة</span>
              <div className="h-5 w-px bg-border hidden sm:block" />

              <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wide">مستحقات</span>
              {([
                { k: 'colOvertime', label: 'أوفر تايم' },
                { k: 'colBonus',    label: 'مكافآت' },
              ] as { k: keyof CompensationColumnVisibility; label: string }[]).map(({ k, label }) => (
                <button
                  key={k}
                  type="button"
                  disabled={isReviewLocked || togglingCol !== null}
                  onClick={() => toggleCol(k)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                    cols[k]
                      ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {cols[k] && <Check className="h-3 w-3" />}
                  {label}
                </button>
              ))}

              <div className="h-5 w-px bg-border" />
              <span className="text-[10px] font-bold text-destructive/80 uppercase tracking-wide">خصومات</span>
              {([
                { k: 'colDedAdvances',  label: 'السلف' },
                { k: 'colDedAbsence',   label: 'غياب' },
                { k: 'colDedLate',      label: 'تأخير' },
                { k: 'colDedPenalties', label: 'جزاءات' },
                { k: 'colDedAdmin',     label: 'خصم او اضافة مباشرة' },
              ] as { k: keyof CompensationColumnVisibility; label: string }[]).map(({ k, label }) => (
                <button
                  key={k}
                  type="button"
                  disabled={isReviewLocked || togglingCol !== null}
                  onClick={() => toggleCol(k)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                    cols[k]
                      ? 'bg-destructive/10 text-destructive border-destructive/30 shadow-soft'
                      : 'bg-card text-muted-foreground border-border hover:border-destructive/30 hover:text-foreground',
                  )}
                >
                  {cols[k] && <Check className="h-3 w-3" />}
                  {label}
                </button>
              ))}

              <div className="ms-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isReviewLocked || pushing}
                  onClick={() => setViolationsPushDialogOpen(true)}
                  className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  دفع الجزاءات
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isReviewLocked || pushing}
                  onClick={() => setAdvancesPushDialogOpen(true)}
                  className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  دفع السلف
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isReviewLocked || pushing}
                  onClick={() => setPushDialogOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  دفع من الحضور
                </Button>
              </div>
            </div>

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

            <CompensationEditConfirmDialog
              open={pendingEdit !== null}
              employeeName={pendingEdit?.employeeName ?? ''}
              fieldLabel={pendingEdit?.fieldLabel ?? ''}
              previousValue={pendingEdit?.previousValue ?? '0'}
              newValue={pendingEdit?.newValue ?? '0'}
              onConfirm={confirmPendingEdit}
              onCancel={cancelPendingEdit}
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
              عُد إلى تعديل الفترة وأضف الموظفين أو مزامنة لقطة العقود لعرض التقرير.
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
          <DirectoryPagedViews
            items={previews}
            resetDeps={[period?.id, filterKey]}
          >
            {(pageItems) => (
          <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
            <div className="overflow-x-auto">
              <table className={cn('w-full border-collapse text-[11.5px]', embedded ? 'min-w-[680px]' : 'min-w-[860px]')}>
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-gradient-to-b from-muted/80 to-muted/50 backdrop-blur-sm text-muted-foreground">
                    <th className="w-9 border-e border-border/60 px-2 py-3 text-center font-semibold">#</th>
                    <th className="min-w-[9.5rem] border-e border-border/60 px-3 py-3 text-right font-semibold">الموظف</th>
                    {!embedded && <th className="min-w-[11rem] border-e border-border/60 px-3 py-3 text-right font-semibold">البدلات (شهري)</th>}
                    <th className="min-w-[5.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">الراتب الأساسي</th>
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">البدلات</th>}
                    {!embedded && cols.colOvertime   && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">أوفر تايم</th>}
                    {!embedded && cols.colBonus      && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مكافآت</th>}
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مستحقات</th>}
                    {!embedded && cols.colDedAdvances && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">السلف</th>}
                    {!embedded && cols.colDedAbsence && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-warning">غياب</th>}
                    {!embedded && cols.colDedLate    && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">تأخير</th>}
                    {!embedded && cols.colDedPenalties&&<th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">جزاءات</th>}
                    {!embedded && cols.colDedAdmin   && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">خصم او اضافة مباشرة</th>}
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive/80">خصومات</th>}
                    <th className="min-w-[6rem] bg-primary/6 px-3 py-3 text-center font-bold text-primary">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row, i) => {
                    const e = edits[row.lineId] ?? rowToEdits(row);
                    const baseline = savedBaselines.current[row.lineId] ?? rowToEdits(row);
                    const netEdit: CompensationEditValues = {
                      ...rowToEdits(row),
                      bonus: e.bonus,
                      admin: e.admin,
                    };
                    const net = lineNetFromEditRow(row.baseSalary, row.allowancesMonthlyTotal, netEdit, cols);
                    const chg = (f: keyof EditRow) => (v: string) => handleChange(row.lineId, f, v);
                    const attempt = (f: keyof EditRow) => (prev: string, next: string) =>
                      attemptEditCommit(row.lineId, f, row.namePrimary, row.baseSalary, prev, next);
                    return (
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
                        {!embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-right">
                            {row.allowanceLines.length === 0 ? (
                              <span className="text-muted-foreground text-[10px]">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                {row.allowanceLines.map(a => (
                                  <div key={a.labelAr} className="flex justify-between gap-2 text-[10px]">
                                    <span className="text-muted-foreground">{a.labelAr}</span>
                                    <span className="font-mono font-semibold tabular-nums text-primary">{fmt(a.amount)}</span>
                                  </div>
                                ))}
                                <div className="mt-0.5 border-t pt-1 text-right text-[10px] font-bold flex items-center justify-between gap-1">
                                  المجموع: 
                                  <span className="font-mono font-bold text-primary">{fmt(row.allowancesMonthlyTotal)}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                          {fmt(row.baseSalary)}
                        </td>
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums">
                            {fmt(row.allowancesMonthlyTotal)}
                          </td>
                        )}
                        {!embedded && cols.colOvertime    && <ReadOnlyAmountCell amount={row.entitlementOvertimeSar} colorClass="text-primary" />}
                        {!embedded && cols.colBonus       && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.bonus} baseline={baseline.bonus} onChange={chg('bonus')} onAttemptCommit={attempt('bonus')} colorClass="text-primary" disabled={isReviewLocked} /></td>}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-primary">
                            {fmt(row.entitlementOvertimeSar + row.entitlementBonusSar)}
                          </td>
                        )}
                        {!embedded && cols.colDedAdvances   && <ReadOnlyAmountCell amount={row.dedAdvancesSar} colorClass="text-destructive" />}
                        {!embedded && cols.colDedAbsence  && <ReadOnlyAmountCell amount={row.dedAbsenceSar} colorClass="text-warning" />}
                        {!embedded && cols.colDedLate     && <ReadOnlyAmountCell amount={row.dedLateSar} colorClass="text-destructive" />}
                        {!embedded && cols.colDedPenalties&& <ReadOnlyAmountCell amount={row.dedPenaltiesSar} colorClass="text-destructive" />}
                        {!embedded && cols.colDedAdmin    && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.admin} baseline={baseline.admin} onChange={chg('admin')} onAttemptCommit={attempt('admin')} allowNegative colorClass={editSignedAmount(e.admin) > 0 ? 'text-primary' : editSignedAmount(e.admin) < 0 ? 'text-destructive' : 'text-muted-foreground'} disabled={isReviewLocked} /></td>}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-destructive">
                            {fmt(row.dedAbsenceSar + row.dedLateSar + row.dedPenaltiesSar)}
                          </td>
                        )}
                        <td className={cn(
                          'bg-primary/5 px-3 py-2 text-center font-mono font-bold tabular-nums',
                          (embedded ? row.lineNetSar : net) < 0 ? 'text-destructive' : 'text-foreground',
                        )}>
                          {fmt(embedded ? row.lineNetSar : net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-gradient-to-b from-primary/6 to-primary/3 font-bold text-[11.5px]">
                    {embedded ? (
                      <>
                        <td colSpan={2} className="border-e border-border/60 px-3 py-3 text-right text-xs font-bold text-primary">المجموع الكلي</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">{fmt(totalBase)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">{fmt(totalAllowances)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(totalEntitlements)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(totalDedNoAdmin)}</td>
                        <td className={cn('bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm', totalNetSar < 0 ? 'text-destructive' : 'text-primary')}>
                          {fmt(totalNetSar)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={3} className="border-e border-border/60 px-3 py-3 text-right text-xs font-bold text-primary">
                          المجموع الكلي
                        </td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">
                          {fmt(totalBase)}
                        </td>
                        {cols.colOvertime    && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(sumPreviewField(r => r.entitlementOvertimeSar))}</td>}
                        {cols.colBonus       && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(sumEditField('bonus'))}</td>}
                        {cols.colDedAdvances   && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(sumPreviewField(r => r.dedAdvancesSar))}</td>}
                        {cols.colDedAbsence  && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-warning">{fmt(sumPreviewField(r => r.dedAbsenceSar))}</td>}
                        {cols.colDedLate     && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(sumPreviewField(r => r.dedLateSar))}</td>}
                        {cols.colDedPenalties&& <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(sumPreviewField(r => r.dedPenaltiesSar))}</td>}
                        {cols.colDedAdmin    && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">{fmt(sumEditField('admin'))}</td>}
                        <td className={cn(
                          'bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm',
                          totalNet < 0 ? 'text-destructive' : 'text-primary',
                        )}>
                          {fmt(totalNet)}
                        </td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
            )}
          </DirectoryPagedViews>
        )}

      </div>
    </>
  );
}

'use client';

import * as React from 'react';
import { Plus, Banknote, Download, CheckCircle2, XCircle, Send, CalendarDays, X } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { toast } from 'sonner';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useCurrentEmployee } from '@/features/hr/organization/employees/hooks/useCurrentEmployee';
import { checkRequestApprovalAccess } from '@/features/hr/requests/lib/request-approval-access';
import {
  buildEmployeeAdvanceDecisionPayload,
  canEmployeeActOnRequestApproval,
  isRequestFullyApproved,
} from '@/features/hr/requests/lib/request-approver-states';
import { RequestApproverStatesPanel } from '@/features/hr/requests/components/request-approver-states-panel';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, SearchableDropdown, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { duplicateAdvanceNumberMessage, isDuplicateAdvanceNumberError } from '@/features/hr/contracts/lib/employee-advance-errors';
import {
  useHREmployeeAdvancesStore,
  ADVANCE_STATUS_LABELS,
  ADVANCE_STATUS_FILTER_ORDER,
  ADVANCE_KIND_LABELS,
  REPAYMENT_MODE_LABELS,
  EDITABLE_ADVANCE_STATUSES,
  DELETABLE_ADVANCE_STATUSES,
  type HREmployeeAdvance,
  type HREmployeeAdvanceKind,
  type HREmployeeAdvanceRepaymentMode,
  type HREmployeeAdvanceStatus,
} from '@/features/hr/contracts/lib/employee-advances-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { cn, formatNumber } from '@/shared/utils';
import { STATUS_PILL } from '@/shared/status-pill-classes';

type StatusFilter = 'all' | HREmployeeAdvanceStatus;

const STATUS_COLORS: Record<HREmployeeAdvanceStatus, string> = {
  draft: STATUS_PILL.muted,
  pending_approval: STATUS_PILL.pending,
  approved: STATUS_PILL.approved,
  rejected: STATUS_PILL.rejected,
  disbursed: STATUS_PILL.info,
  repaying: STATUS_PILL.warning,
  fully_repaid: STATUS_PILL.approved,
  cancelled: STATUS_PILL.cancelled,
};

type DraftForm = {
  employeeId: string;
  employeeNameAr: string;
  amount: string;
  currency: string;
  advanceDate: string;
  note: string;
  advanceKind: HREmployeeAdvanceKind;
  repaymentMode: HREmployeeAdvanceRepaymentMode;
  repaymentMonths: string;
  monthlyInstallment: string;
};

const EMPTY_FORM: DraftForm = {
  employeeId: '', employeeNameAr: '', amount: '', currency: 'SAR',
  advanceDate: new Date().toISOString().slice(0, 10), note: '',
  advanceKind: 'personal',
  repaymentMode: 'by_months',
  repaymentMonths: '12',
  monthlyInstallment: '',
};

function repaymentLine(x: HREmployeeAdvance): string {
  if (x.repaymentMode === 'by_months' && x.repaymentMonths != null && x.repaymentMonths > 0) {
    const per = x.amount / x.repaymentMonths;
    return `${x.repaymentMonths} شهر · ≈ ${formatNumber(Math.round(per * 100) / 100)} ${x.currency}/شهر`;
  }
  if (x.repaymentMode === 'by_monthly_amount' && x.monthlyInstallmentAmount != null && x.monthlyInstallmentAmount > 0) {
    const approxMonths = Math.ceil(x.amount / x.monthlyInstallmentAmount);
    return `${formatNumber(x.monthlyInstallmentAmount)} ${x.currency}/شهر · ~${approxMonths} شهر`;
  }
  return '—';
}

function isEditable(status: HREmployeeAdvanceStatus): boolean {
  return EDITABLE_ADVANCE_STATUSES.includes(status);
}

function isDeletable(status: HREmployeeAdvanceStatus): boolean {
  return DELETABLE_ADVANCE_STATUSES.includes(status);
}

function canOpenAdvanceDetail(status: HREmployeeAdvanceStatus): boolean {
  return status === 'pending_approval' || status === 'approved' || status === 'rejected';
}

export function EmployeeAdvancesClient() {
  const companyId = useDefaultCompanyId();
  const authUser = useAuthStore((s) => s.user);
  const { data: currentEmployee } = useCurrentEmployee();
  const currentEmployeeId = currentEmployee?.id ?? null;
  const decidedByActor = authUser?.id ?? undefined;

  const {
    items, add, update, remove, fetch: fetchAdvances,
    submitForApproval, approve, reject,
  } = useHREmployeeAdvancesStore();
  const { employees: allEmployees, fetch: fetchEmployees } = useHREmployeeDirectoryStore();
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  React.useEffect(() => {
    if (allEmployees.length === 0) void fetchEmployees();
  }, [allEmployees.length, fetchEmployees]);

  const empOptions = React.useMemo(() =>
    employees.map(e => ({ value: e.id, label: e.nameAr })),
    [employees],
  );

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>({ from: '', to: '' });
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const empPickerList = React.useMemo(
    () => employees.map(e => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [detailAdvance, setDetailAdvance] = React.useState<HREmployeeAdvance | null>(null);

  const fetchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    const status = statusFilter !== 'all' ? statusFilter : undefined;
    const advanceDateFrom = dateBounds.from || undefined;
    const advanceDateTo = dateBounds.to || undefined;
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => {
      void fetchAdvances({ employeeId, status, advanceDateFrom, advanceDateTo }).catch((e) => {
        handleApiError(e, 'employee-advances/fetch');
      });
    }, 400);
    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    };
  }, [selectedEmpIds, statusFilter, dateBounds, fetchAdvances]);

  const advanceStatusCounts = React.useMemo((): Record<string, number> => {
    const counts: Record<string, number> = { all: items.length };
    for (const key of ADVANCE_STATUS_FILTER_ORDER) {
      counts[key] = items.filter((x) => x.status === key).length;
    }
    return counts;
  }, [items]);

  const filtered = React.useMemo(
    () => [...items].sort((a, b) => b.advanceDate.localeCompare(a.advanceDate)),
    [items],
  );

  const runAction = async (id: string, action: () => Promise<void>, successMessage: string) => {
    setActionLoadingId(id);
    try {
      await action();
      toast.success(successMessage);
    } catch (e) {
      handleApiError(e, 'employee-advances/action');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveAdvance = React.useCallback(async (x: HREmployeeAdvance) => {
    if (!companyId || !currentEmployeeId) return;
    try {
      const access = await checkRequestApprovalAccess(
        'advance',
        companyId,
        currentEmployeeId,
        x.approverStates,
      );
      if (!access.ok) {
        toast.warning(access.message);
        return;
      }
      const payload = buildEmployeeAdvanceDecisionPayload(
        access.states,
        currentEmployeeId,
        'approve',
        { decidedBy: decidedByActor },
      );
      setActionLoadingId(x.id);
      await approve(x.id, payload);
      if (payload.approverStates && isRequestFullyApproved(payload.approverStates)) {
        toast.success('تم اعتماد السلفة نهائياً.');
      } else {
        toast.success('تم تسجيل موافقتك — بانتظار بقية المعتمدين.');
      }
      setDetailAdvance(null);
    } catch (e) {
      const { status, displayMessage } = handleApiError(e, 'employee-advances/decide.approve');
      if (status === 404) {
        toast.error('مسار موافقة السلف غير مفعّل على الخادم. يُرجى من فريق الباك تفعيل PATCH أو POST على /payroll/employee-advances/{id}/decision.');
      } else {
        toast.error(displayMessage);
      }
    } finally {
      setActionLoadingId(null);
    }
  }, [approve, companyId, currentEmployeeId, decidedByActor]);

  const handleRejectAdvance = React.useCallback(async (x: HREmployeeAdvance) => {
    if (!companyId || !currentEmployeeId) return;
    try {
      const access = await checkRequestApprovalAccess(
        'advance',
        companyId,
        currentEmployeeId,
        x.approverStates,
      );
      if (!access.ok) {
        toast.warning(access.message);
        return;
      }
      const payload = buildEmployeeAdvanceDecisionPayload(
        access.states,
        currentEmployeeId,
        'reject',
        { decidedBy: decidedByActor },
      );
      setActionLoadingId(x.id);
      await reject(x.id, payload);
      toast.message('تم رفض السلفة.');
      setDetailAdvance(null);
    } catch (e) {
      const { status, displayMessage } = handleApiError(e, 'employee-advances/decide.reject');
      if (status === 404) {
        toast.error('مسار موافقة السلف غير مفعّل على الخادم. يُرجى من فريق الباك تفعيل PATCH أو POST على /payroll/employee-advances/{id}/decision.');
      } else {
        toast.error(displayMessage);
      }
    } finally {
      setActionLoadingId(null);
    }
  }, [companyId, currentEmployeeId, decidedByActor, reject]);

  const canShowApprovalActions = React.useCallback(
    (x: HREmployeeAdvance) =>
      x.status === 'pending_approval' && canEmployeeActOnRequestApproval(x.approverStates, currentEmployeeId),
    [currentEmployeeId],
  );

  const openAdvanceDetail = (x: HREmployeeAdvance) => {
    setDetailAdvance(x);
  };

  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setError(null); setDrawerOpen(true);
  };

  const openEdit = (id: string) => {
    const x = items.find(i => i.id === id);
    if (!x || !isEditable(x.status)) return;
    setEditId(id);
    setForm({
      employeeId: x.employeeId, employeeNameAr: x.employeeNameAr,
      amount: String(x.amount), currency: x.currency,
      advanceDate: x.advanceDate, note: x.note,
      advanceKind: x.advanceKind,
      repaymentMode: x.repaymentMode,
      repaymentMonths: x.repaymentMonths != null ? String(x.repaymentMonths) : '12',
      monthlyInstallment: x.monthlyInstallmentAmount != null ? String(x.monthlyInstallmentAmount) : '',
    });
    setError(null); setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }
    if (!form.advanceDate) { setError('تاريخ السلفة مطلوب'); return; }
    let repaymentMonths: number | null = null;
    let monthlyInstallmentAmount: number | null = null;
    if (form.repaymentMode === 'by_months') {
      const m = parseInt(form.repaymentMonths, 10);
      if (!Number.isFinite(m) || m < 1 || m > 600) {
        setError('أدخل عدد أشهر صحيحاً (1–600)');
        return;
      }
      repaymentMonths = m;
    } else {
      const inst = parseFloat(form.monthlyInstallment);
      if (!form.monthlyInstallment.trim() || Number.isNaN(inst) || inst <= 0) {
        setError('أدخل مبلغ القسط الشهري');
        return;
      }
      if (inst > amount) {
        setError('المبلغ الشهري لا يجوز أن يتجاوز إجمالي السلفة');
        return;
      }
      monthlyInstallmentAmount = inst;
    }
    const payload = {
      employeeId: form.employeeId, employeeNameAr: form.employeeNameAr,
      amount, currency: form.currency,
      advanceDate: form.advanceDate, note: form.note,
      advanceKind: form.advanceKind,
      repaymentMode: form.repaymentMode,
      repaymentMonths,
      monthlyInstallmentAmount,
    };
    try {
      setSaving(true);
      if (editId) {
        await update(editId, payload);
        toast.success('تم تحديث السلفة.');
      } else {
        await add(payload);
        toast.success('تم إنشاء السلفة — قيد الموافقة.');
      }
      setDrawerOpen(false);
    } catch (e) {
      if (isDuplicateAdvanceNumberError(e)) {
        setError(duplicateAdvanceNumberMessage());
      } else if (e instanceof Error && e.message === duplicateAdvanceNumberMessage()) {
        setError(e.message);
      } else {
        setError(handleApiError(e, 'employee-advances/save').displayMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const patch = (p: Partial<DraftForm>) => setForm(f => ({ ...f, ...p }));

  const handleEmployeeSelect = (id: string) => {
    const emp = employees.find(e => e.id === id);
    patch({ employeeId: id, employeeNameAr: emp?.nameAr ?? '' });
  };

  const downloadCsv = () => {
    const rows = [['رقم السلفة', 'الموظف', 'المبلغ', 'العملة', 'نوع السلفة', 'آلية القسط', 'عدد الأشهر', 'القسط الشهري', 'التاريخ', 'الحالة', 'ملاحظة']];
    filtered.forEach(x => rows.push([
      x.advanceNumber,
      x.employeeNameAr,
      String(x.amount),
      x.currency,
      ADVANCE_KIND_LABELS[x.advanceKind],
      REPAYMENT_MODE_LABELS[x.repaymentMode],
      x.repaymentMonths != null ? String(x.repaymentMonths) : '',
      x.monthlyInstallmentAmount != null ? String(x.monthlyInstallmentAmount) : '',
      x.advanceDate,
      ADVANCE_STATUS_LABELS[x.status],
      x.note,
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'employee-advances.csv'; a.click();
  };

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const statusFilterLabels = React.useMemo(
    () => Object.fromEntries(
      ADVANCE_STATUS_FILTER_ORDER.map((key) => [key, ADVANCE_STATUS_LABELS[key]]),
    ) as Record<string, string>,
    [],
  );

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          سلفة جديدة
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const hasDateFilter = Boolean(dateBounds.from || dateBounds.to);
  const dateLabel = hasDateFilter
    ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}`
    : 'نطاق التاريخ';

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={ADVANCE_STATUS_FILTER_ORDER}
        statusLabels={statusFilterLabels}
        statusCounts={advanceStatusCounts}
        onDateBoundsChange={() => {}}
        leadingFilters={
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors',
                hasDateFilter
                  ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
              dir="ltr"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[160px] truncate" dir="rtl">{dateLabel}</span>
            </button>
            {hasDateFilter && (
              <button
                type="button"
                aria-label="مسح التاريخ"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); setDateBounds({ from: '', to: '' }); }}
                className="absolute -end-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        }
        trailingActions={
          filtered.length > 0 ? (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={downloadCsv}>
              <Download className="h-3.5 w-3.5" />تصدير
            </Button>
          ) : undefined
        }
      />
    ),
    [
      statusFilter,
      selectedEmpKey,
      dateBounds,
      hasDateFilter,
      advanceStatusCounts.all,
      advanceStatusCounts,
      filtered.length,
      empPickerList,
      statusFilterLabels,
    ],
  );

  return (
    <>
      <DateRangePicker
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        value={dateBounds}
        onApply={(range) => setDateBounds(range)}
      />

      <SetPageTitle titleAr="سلف الموظفين" descriptionAr="تسجيل وإدارة سلف الموظفين واعتمادها." iconName="Banknote" />

      {filtered.length === 0 ? (
        <EmptyState icon={Banknote} title="لا توجد سلف" description="أضف سلفة جديدة لموظف للبدء." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(x => {
            const loading = actionLoadingId === x.id;
            const canSubmit = x.status === 'draft' || x.status === 'rejected';
            const openDetail = canOpenAdvanceDetail(x.status);
            const openEditOnClick = isEditable(x.status) && x.status !== 'pending_approval';

            return (
              <div
                key={x.id}
                className={cn(
                  'rounded-lg border border-border bg-card p-3 shadow-soft space-y-2 flex flex-col',
                  (openDetail || openEditOnClick) && 'cursor-pointer',
                )}
                onClick={() => {
                  if (openDetail) openAdvanceDetail(x);
                  else if (openEditOnClick) openEdit(x.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{x.employeeNameAr}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5" dir="ltr">{x.advanceNumber}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{x.advanceDate}</p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', STATUS_COLORS[x.status])}>
                    {ADVANCE_STATUS_LABELS[x.status]}
                  </Badge>
                </div>
                {canShowApprovalActions(x) && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs text-success border-success/30 hover:bg-success/10"
                      disabled={loading}
                      onClick={() => void handleApproveAdvance(x)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={loading}
                      onClick={() => void handleRejectAdvance(x)}
                    >
                      <XCircle className="h-3.5 w-3.5 me-1" />
                      رفض
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {ADVANCE_KIND_LABELS[x.advanceKind]}
                  </Badge>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-center">
                  <p className="text-base font-bold tabular-nums text-foreground">
                    {formatNumber(x.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{x.currency}</p>
                  <p className="text-[10px] leading-snug text-muted-foreground">{repaymentLine(x)}</p>
                </div>
                {x.note && (
                  <p className="text-[11px] text-muted-foreground  ">{x.note}</p>
                )}
                {x.approvedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    تاريخ الاعتماد: {x.approvedAt.slice(0, 10)}
                  </p>
                )}
                <RequestApproverStatesPanel
                  states={x.approverStates}
                  compact
                  className="border-0 bg-transparent p-0"
                />
                <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2" onClick={e => e.stopPropagation()}>
                  {canSubmit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary"
                      disabled={loading}
                      onClick={() => void runAction(x.id, () => submitForApproval(x.id), 'تم إرسال السلفة للموافقة.')}
                    >
                      <Send className="h-3 w-3 me-1" />
                      إرسال للموافقة
                    </Button>
                  )}
                  {isEditable(x.status) && x.status !== 'pending_approval' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={loading} onClick={() => openEdit(x.id)}>
                      تعديل
                    </Button>
                  )}
                  {isDeletable(x.status) && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" disabled={loading} onClick={() => setConfirmId(x.id)}>
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل السلفة' : 'سلفة جديدة'}
        onSave={() => void handleSave()} saveDisabled={saving} error={error}
      >
        <FormField label="الموظف" required>
          <SearchableDropdown
            value={form.employeeId}
            onChange={handleEmployeeSelect}
            options={empOptions}
            placeholder="اختر الموظف…"
            disabled={!!editId}
          />
        </FormField>
        <FormField label="المبلغ" required>
          <Input type="number" min="0" value={form.amount} onChange={e => patch({ amount: e.target.value })} placeholder="0" />
        </FormField>
        <FormField label="نوع السلفة" required>
          <MinimalDropdown
            value={form.advanceKind}
            onChange={v => patch({ advanceKind: v as HREmployeeAdvanceKind })}
            options={Object.entries(ADVANCE_KIND_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </FormField>
        <FormField label="آلية حساب القسط الشهري" span2>
          <MinimalDropdown
            value={form.repaymentMode}
            onChange={v => patch({ repaymentMode: v as HREmployeeAdvanceRepaymentMode })}
            options={Object.entries(REPAYMENT_MODE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {form.repaymentMode === 'by_months' ? (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-muted-foreground">يُقسَّط إجمالي السلفة على عدد الأشهر التي تدخلها.</p>
              <Input
                type="number"
                min={1}
                max={600}
                className="max-w-[10rem]"
                value={form.repaymentMonths}
                onChange={e => patch({ repaymentMonths: e.target.value })}
                placeholder="مثال: 12"
              />
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-muted-foreground">يُخصم شهرياً المبلغ التالي حتى اكتمال السداد.</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="max-w-[10rem]"
                value={form.monthlyInstallment}
                onChange={e => patch({ monthlyInstallment: e.target.value })}
                placeholder="مبلغ القسط"
              />
            </div>
          )}
        </FormField>
        <FormField label="العملة">
          <MinimalDropdown
            value={form.currency}
            onChange={v => patch({ currency: v })}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }]}
          />
        </FormField>
        <FormField label="تاريخ السلفة" required>
          <DatePickerInput value={form.advanceDate} onChange={(ymd) => patch({ advanceDate: ymd })} />
        </FormField>
        {!editId && (
          <p className="col-span-2 text-[11px] text-muted-foreground">
            تُنشأ السلفة الجديدة بحالة «قيد الموافقة» ويمكن اعتمادها أو رفضها مباشرة.
          </p>
        )}
        <FormField label="ملاحظة" span2>
          <Input value={form.note} onChange={e => patch({ note: e.target.value })} placeholder="ملاحظة اختيارية…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={v => { if (!v) setConfirmId(null); }}
        title="حذف السلفة"
        description="هل أنت متأكد من حذف هذا السجل؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => {
          if (!confirmId) return;
          void (async () => {
            try {
              await remove(confirmId);
              toast.success('تم حذف السلفة.');
              setConfirmId(null);
            } catch (e) {
              handleApiError(e, 'employee-advances/delete');
            }
          })();
        }}
      />

      <Dialog open={detailAdvance != null} onOpenChange={(o) => { if (!o) setDetailAdvance(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل السلفة</DialogTitle>
          </DialogHeader>
          {detailAdvance ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">الموظف</p>
                  <p className="text-sm font-medium">{detailAdvance.employeeNameAr}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم السلفة</p>
                  <p className="text-sm font-medium font-mono" dir="ltr">{detailAdvance.advanceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ</p>
                  <p className="text-sm font-medium tabular-nums">{formatNumber(detailAdvance.amount)} {detailAdvance.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ السلفة</p>
                  <p className="text-sm font-medium font-mono">{detailAdvance.advanceDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">نوع السلفة</p>
                  <p className="text-sm font-medium">{ADVANCE_KIND_LABELS[detailAdvance.advanceKind]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">حالة السلفة</p>
                  <p className="text-sm font-medium">{ADVANCE_STATUS_LABELS[detailAdvance.status]}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">آلية السداد</p>
                  <p className="text-sm">{repaymentLine(detailAdvance)}</p>
                </div>
                {detailAdvance.note ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">ملاحظة</p>
                    <p className="text-sm">{detailAdvance.note}</p>
                  </div>
                ) : null}
                {detailAdvance.decisionNotes ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">ملاحظات القرار</p>
                    <p className="text-sm">{detailAdvance.decisionNotes}</p>
                  </div>
                ) : null}
              </div>
              <RequestApproverStatesPanel states={detailAdvance.approverStates} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

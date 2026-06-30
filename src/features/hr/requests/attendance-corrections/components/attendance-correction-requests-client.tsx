'use client';

import * as React from 'react';
import { Ban, CalendarDays, CheckCircle2, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModernTimePicker from '@/components/ui/modern-time-picker';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  EntityActionCard,
  EntityActionCardChip,
  EntityActionCardGrid,
  type WorkflowStatusTone,
} from '@/components/ui/entity-action-card';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { correctionRequestsApi } from '@/features/hr/requests/lib/api/correction-requests';
import { mapCorrectionRequest } from '@/features/hr/requests/lib/attendance-correction-store';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { FormField, EmptyState } from '@/components/ui/shared-dialogs';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useCurrentEmployee } from '@/features/hr/organization/employees/hooks/useCurrentEmployee';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { checkRequestApprovalAccess } from '@/features/hr/requests/lib/request-approval-access';
import {
  buildRequestCorrectionDecisionPayload,
  getRequestApprovalUiState,
  isEmployeeInRequestApproverStates,
  isRequestFullyApproved,
} from '@/features/hr/requests/lib/request-approver-states';
import { RequestApproverStatesPanel } from '@/features/hr/requests/components/request-approver-states-panel';
import { RequestApprovalActionCell, RequestApprovalActionButtons } from '@/features/hr/requests/components/request-approval-actions';
import { RequestApproversInline } from '@/features/hr/requests/components/request-approvers-inline';
import {
  CorrectionTimesComparisonCell,
  CorrectionTimesComparisonDetail,
} from '@/features/hr/requests/components/correction-period-times';
import {
  useAttendanceCorrectionRequestsStore,
  attendanceCorrectionStatusLabelAr,
} from '@/features/hr/requests/lib/attendance-correction-store';
import type { AttendanceCorrectionRequest } from '@/features/hr/requests/lib/attendance-correction-store';
import { cn } from '@/shared/utils';
import {
  hrFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/lib/use-persisted-filter-state';

import { AR_CORRECTION_REQUEST_STATUS_LABELS } from '@/shared/i18n/ar';

type ViewMode = 'cards' | 'list';

const STATUS_ORDER: readonly string[] = ['pending', 'approved', 'rejected'];
const STATUS_LABELS: Record<string, string> = AR_CORRECTION_REQUEST_STATUS_LABELS;

const CORRECTION_STATUS_TONE: Record<AttendanceCorrectionRequest['status'], WorkflowStatusTone> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'muted',
};

function statusBadgeClass(s: AttendanceCorrectionRequest['status']) {
  if (s === 'pending') return 'bg-gold/15 text-gold border-gold/30';
  if (s === 'approved') return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

export function AttendanceCorrectionRequestsClient() {
  const companyId = useDefaultCompanyId();
  const authUser = useAuthStore((s) => s.user);
  const { data: currentEmployee } = useCurrentEmployee();
  const currentEmployeeId = currentEmployee?.id ?? null;
  const updatedByActor = authUser?.id ?? undefined;
  const departments = useHRConfigurationStore((s) => s.departments);
  const { requestTypes, fetchRequestTypes, fetchDepartments } = useHRConfigurationStore();
  const employees = useHREmployeeDirectoryStore((s) => s.employees);
  const fetchEmployees = useHREmployeeDirectoryStore((s) => s.fetch);
  const activeEmployees = React.useMemo(() => employees.filter((e) => e.status === 'active'), [employees]);

  const { submit, approve, reject, cancel } = useAttendanceCorrectionRequestsStore();

  React.useEffect(() => {
    if (!companyId) return;
    fetchRequestTypes();
    fetchDepartments();
    fetchEmployees();
  }, [companyId]);

  const attendanceRequestTypes = React.useMemo(
    () => requestTypes.filter(rt => rt.isActive),
    [requestTypes],
  );

  const [appliedDept, setAppliedDept] = usePersistedFilterState(
    hrFiltersKey('requests', 'attendance-corrections', companyId, 'appliedDept'),
    'all',
  );
  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    hrFiltersKey('requests', 'attendance-corrections', companyId, 'selectedEmpIds'),
  );
  const [statusFilter, setStatusFilter] = usePersistedFilterState(
    hrFiltersKey('requests', 'attendance-corrections', companyId, 'statusFilter'),
    'all',
  );
  const [dateBounds, setDateBounds] = usePersistedFilterState(
    hrFiltersKey('requests', 'attendance-corrections', companyId, 'dateBounds'),
    { from: '', to: '' },
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formRequestTypeId, setFormRequestTypeId] = React.useState('');
  const [formWorkDate, setFormWorkDate] = React.useState('');
  const [formCorrIn, setFormCorrIn] = React.useState('');
  const [formCorrOut, setFormCorrOut] = React.useState('');
  const [formReason, setFormReason] = React.useState('');
  const [detailRow, setDetailRow] = React.useState<AttendanceCorrectionRequest | null>(null);
  const [viewMode, setViewMode] = usePersistedFilterState<ViewMode>(
    hrFiltersKey('requests', 'attendance-corrections', companyId, 'viewMode'),
    'cards',
  );

  const deptOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...departments.filter((d) => d.isActive).map((d) => ({ value: d.id, label: d.nameAr }))],
    [departments],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);
  const bulkMode = appliedDept !== 'all' || selectedEmpIds.size > 1;

  const buildListQuery = React.useCallback((page: number, pageSize: number) => ({
    companyId: companyId!,
    page,
    limit: pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(dateBounds.from ? { workDateFrom: dateBounds.from } : {}),
    ...(dateBounds.to ? { workDateTo: dateBounds.to } : {}),
    ...(selectedEmpIds.size === 1 ? { employeeId: [...selectedEmpIds][0] } : {}),
  }), [companyId, statusFilter, dateBounds.from, dateBounds.to, selectedEmpIds]);

  const applyDeptFilter = React.useCallback((rows: AttendanceCorrectionRequest[]) => {
    if (appliedDept === 'all') return rows;
    const deptName = departments.find((d) => d.id === appliedDept)?.nameAr ?? appliedDept;
    return rows.filter((r) => r.departmentNameAr === deptName);
  }, [appliedDept, departments]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as AttendanceCorrectionRequest[], total: 0 };
    try {
      const res = await correctionRequestsApi.list(buildListQuery(page, pageSize));
      const items = applyDeptFilter(res.items.map(mapCorrectionRequest));
      return { items, total: appliedDept === 'all' ? res.pagination.total : items.length };
    } catch {
      return { items: [], total: 0 };
    }
  }, [applyDeptFilter, appliedDept, buildListQuery, companyId]);

  const loadBulk = React.useCallback(async () => {
    if (!companyId) return { items: [] as AttendanceCorrectionRequest[], total: 0 };
    const res = await fetchAllPaginatedItems((page, limit) => correctionRequestsApi.list(buildListQuery(page, limit)));
    let items = res.items.map(mapCorrectionRequest);
    if (selectedEmpIds.size > 1) {
      items = items.filter((r) => selectedEmpIds.has(r.employeeId));
    }
    items = applyDeptFilter(items);
    return { items, total: items.length };
  }, [applyDeptFilter, buildListQuery, companyId, selectedEmpIds]);

  const {
    items: sorted,
    loading: listLoading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<AttendanceCorrectionRequest>(loadPage, {
    enabled: !!companyId,
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [companyId, appliedDept, statusFilter, dateBounds.from, dateBounds.to, selectedEmpKey],
  });

  const statusCounts = React.useMemo(
    () => ({
      all: pagination.total,
      pending: sorted.filter((r) => r.status === 'pending').length,
      approved: sorted.filter((r) => r.status === 'approved').length,
      rejected: sorted.filter((r) => r.status === 'rejected').length,
    }),
    [sorted, pagination.total],
  );

  const resetForm = React.useCallback(() => {
    setFormEmpId('');
    setFormRequestTypeId('');
    setFormWorkDate('');
    setFormCorrIn('');
    setFormCorrOut('');
    setFormReason('');
  }, []);

  const openNew = React.useCallback(() => {
    resetForm();
    if (activeEmployees.length) setFormEmpId(activeEmployees[0]!.id);
    if (attendanceRequestTypes.length) setFormRequestTypeId(attendanceRequestTypes[0]!.id);
    setDialogOpen(true);
  }, [activeEmployees, attendanceRequestTypes, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submit({
      employeeId: formEmpId,
      requestTypeId: formRequestTypeId,
      workDate: formWorkDate,
      correctedCheckIn: formCorrIn,
      correctedCheckOut: formCorrOut,
      reasonAr: formReason.trim(),
    });
    if (res.ok === false) {
      toast.error(res.error);
      return;
    }
    toast.success('تم تسجيل طلب التصحيح — قيد الموافقة.');
    resetForm();
    setDialogOpen(false);
    await reloadList();
  };

  const handleApprove = React.useCallback(async (r: AttendanceCorrectionRequest) => {
    if (!companyId || !currentEmployeeId) return;
    try {
      const access = await checkRequestApprovalAccess(
        'attendance',
        companyId,
        currentEmployeeId,
        r.approverStates,
      );
      if (!access.ok) {
        toast.warning(access.message);
        return;
      }
      const payload = buildRequestCorrectionDecisionPayload(
        access.states,
        currentEmployeeId,
        'approve',
        { updatedBy: updatedByActor },
      );
      await approve(r.id, payload);
      if (payload.approverStates && isRequestFullyApproved(payload.approverStates)) {
        toast.success('تم اعتماد طلب التصحيح نهائياً.');
      } else {
        toast.success('تم تسجيل موافقتك — بانتظار بقية المعتمدين.');
      }
      await reloadList();
      setDetailRow(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'correction-requests.decide.approve');
      toast.error(displayMessage);
    }
  }, [approve, companyId, currentEmployeeId, reloadList, updatedByActor]);

  const handleReject = React.useCallback(async (r: AttendanceCorrectionRequest) => {
    if (!companyId || !currentEmployeeId) return;
    try {
      const access = await checkRequestApprovalAccess(
        'attendance',
        companyId,
        currentEmployeeId,
        r.approverStates,
      );
      if (!access.ok) {
        toast.warning(access.message);
        return;
      }
      const payload = buildRequestCorrectionDecisionPayload(
        access.states,
        currentEmployeeId,
        'reject',
        { updatedBy: updatedByActor },
      );
      await reject(r.id, payload);
      toast.message('تم رفض الطلب.');
      await reloadList();
      setDetailRow(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'correction-requests.decide.reject');
      toast.error(displayMessage);
    }
  }, [companyId, currentEmployeeId, reject, reloadList, updatedByActor]);

  const canShowApprovalActions = React.useCallback(
    (r: AttendanceCorrectionRequest) =>
      r.status === 'pending' && getRequestApprovalUiState(r.approverStates, currentEmployeeId).showActions,
    [currentEmployeeId],
  );

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (appliedDept !== 'all') count++;
    if (selectedEmpIds.size > 0) count++;
    if (dateBounds.from || dateBounds.to) count++;
    if (statusFilter !== 'all') count++;
    return count;
  }, [appliedDept, selectedEmpIds.size, dateBounds.from, dateBounds.to, statusFilter]);

  useSetPageTitle({ titleAr: 'تصحيح الحضور', descriptionAr: 'طلبات تصحيح أوقات الحضور والانصراف', iconName: 'CalendarClock' });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          طلب تصحيح حضور
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        optionalDateRange
        periodValue={dateBounds}
        onPeriodChange={setDateBounds}
        inlineSelects={[
          {
            id: 'dept',
            value: appliedDept,
            onChange: setAppliedDept,
            placeholder: 'القسم',
            options: deptOptions,
          },
        ]}
        companyId={companyId}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS}
        statusCounts={statusCounts}
        onDateBoundsChange={setDateBounds}
        dataView={{
          value: viewMode,
          onChange: (v) => setViewMode(v as ViewMode),
          options: [
            { value: 'cards', label: 'بطاقات', icon: 'layout-grid' },
            { value: 'list', label: 'جدول', icon: 'list' },
          ],
        }}
      />
    ),
    [
      appliedDept,
      selectedEmpIds,
      statusFilter,
      dateBounds.from,
      dateBounds.to,
      statusCounts.all,
      statusCounts.pending,
      statusCounts.approved,
      statusCounts.rejected,
      deptOptions,
      companyId,
      viewMode,
    ],
  );

  const columns: ColumnDef<AttendanceCorrectionRequest>[] = React.useMemo(
    () => [
      {
        key: 'emp',
        title: 'الموظف',
        render: (r) => (
          <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {r.employeeNameAr.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{r.employeeNameAr}</p>
              <p className="text-[10px] text-muted-foreground">{r.departmentNameAr || '—'}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'requestType',
        title: 'نوع الطلب',
        hideOnMobile: true,
        render: (r) => (
          <div>
            <p className="text-sm font-medium">{r.requestTypeNameAr}</p>
            {r.subtypeNameAr ? (
              <p className="text-[10px] text-muted-foreground">{r.subtypeNameAr}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'prevStatus',
        title: 'الحالة السابقة',
        render: (r) => <span className="text-xs text-foreground">{r.previousStatusAr}</span>,
      },
      {
        key: 'status',
        title: 'حالة الطلب',
        render: (r) => (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', statusBadgeClass(r.status))}>
            <span className={cn('h-1.5 w-1.5 rounded-full', r.status === 'pending' ? 'bg-gold' : r.status === 'approved' ? 'bg-emerald-500' : 'bg-destructive')} />
            {attendanceCorrectionStatusLabelAr(r.status)}
          </span>
        ),
      },
      {
        key: 'reason',
        title: 'السبب / الملاحظات',
        hideOnMobile: true,
        render: (r) => <span className="text-xs text-muted-foreground   max-w-[200px]">{r.reasonAr || '—'}</span>,
      },
      {
        key: 'times',
        title: 'أوقات التصحيح',
        render: (r) => (
          <CorrectionTimesComparisonCell
            previousCheckIn={r.previousCheckIn}
            previousCheckOut={r.previousCheckOut}
            correctedPeriods={r.correctedPeriods}
          />
        ),
      },
      {
        key: 'workDate',
        title: 'تاريخ التصحيح',
        render: (r) => <TableDateCell value={r.workDate} />,
      },
      {
        key: 'submittedAt',
        title: 'تاريخ التقديم',
        hideOnMobile: true,
        render: (r) => <TableDateCell value={r.submittedAt} mode="datetime" />,
      },
      {
        key: 'approvers',
        title: 'مسار الموافقة',
        hideOnMobile: true,
        render: (r) => <RequestApproversInline states={r.approverStates} />,
      },
      {
        key: 'decisionNotes',
        title: 'ملاحظات القرار',
        hideOnMobile: true,
        render: (r) => (
          <span className="line-clamp-2 max-w-[12rem] text-xs text-muted-foreground" title={r.decisionNotesAr || undefined}>
            {r.decisionNotesAr || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'إجراء',
        isActions: true,
        render: (r) => {
          if (r.status !== 'pending') {
            return <TableDateCell value={r.decidedAt} mode="datetime" />;
          }
          if (getRequestApprovalUiState(r.approverStates, currentEmployeeId).showActions) {
            return (
              <RequestApprovalActionCell
                states={r.approverStates}
                currentEmployeeId={currentEmployeeId}
                onApprove={() => void handleApprove(r)}
                onReject={() => void handleReject(r)}
              />
            );
          }
          if (!isEmployeeInRequestApproverStates(r.approverStates, currentEmployeeId)) {
            return (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs text-amber-600"
                onClick={(e) => {
                  e.stopPropagation();
                  void cancel(r.id).then(async () => {
                    toast.message('تم سحب الطلب.');
                    await reloadList();
                  });
                }}
              >
                إلغاء
              </Button>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
    ],
    [cancel, currentEmployeeId, handleApprove, handleReject, reloadList],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="space-y-2">
        {!listLoading && sorted.length === 0 && pagination.total === 0 ? (
          <EmptyState title="لا توجد طلبات ضمن الفلاتر" />
        ) : (
          <DirectoryPagedViews
            items={sorted}
            serverPagination={pagination}
            loading={listLoading}
          >
            {(pageItems) => (
              viewMode === 'cards' ? (
                <EntityActionCardGrid>
                  {pageItems.map((r) => (
                    <EntityActionCard
                      key={r.id}
                      onClick={() => setDetailRow(r)}
                      title={r.employeeNameAr}
                      subtitle={r.departmentNameAr || '—'}
                      status={{
                        label: attendanceCorrectionStatusLabelAr(r.status),
                        tone: CORRECTION_STATUS_TONE[r.status],
                      }}
                      chips={
                        <>
                          <EntityActionCardChip>
                            {r.requestTypeNameAr}
                            {r.subtypeNameAr ? ` — ${r.subtypeNameAr}` : ''}
                          </EntityActionCardChip>
                          <EntityActionCardChip className="font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1" dir="ltr">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {r.workDate}
                            </span>
                          </EntityActionCardChip>
                          <EntityActionCardChip>
                            الحالة السابقة: {r.previousStatusAr}
                          </EntityActionCardChip>
                          {r.submittedAt ? (
                            <EntityActionCardChip className="font-mono tabular-nums">
                              <span className="inline-flex items-center gap-1" dir="ltr">
                                <CalendarDays className="h-3 w-3 shrink-0" />
                                {r.submittedAt.slice(0, 10)}
                              </span>
                            </EntityActionCardChip>
                          ) : null}
                        </>
                      }
                      description={
                        [r.reasonAr, r.decisionNotesAr?.trim() ? `ملاحظات القرار: ${r.decisionNotesAr}` : '']
                          .filter(Boolean)
                          .join(' — ') || undefined
                      }
                      workflow={
                        canShowApprovalActions(r)
                          ? {
                              showApproveReject: true,
                              onApprove: () => void handleApprove(r),
                              onReject: () => void handleReject(r),
                              disabled: !getRequestApprovalUiState(r.approverStates, currentEmployeeId).canAct,
                              waitingReason: getRequestApprovalUiState(r.approverStates, currentEmployeeId).reasonAr ?? undefined,
                            }
                          : undefined
                      }
                      extraFooter={
                        r.status === 'pending' && !isEmployeeInRequestApproverStates(r.approverStates, currentEmployeeId) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-amber-600"
                            onClick={async () => {
                              await cancel(r.id);
                              toast.message('تم سحب الطلب.');
                              await reloadList();
                            }}
                          >
                            إلغاء
                          </Button>
                        ) : undefined
                      }
                    >
                      <CorrectionTimesComparisonCell
                        previousCheckIn={r.previousCheckIn}
                        previousCheckOut={r.previousCheckOut}
                        correctedPeriods={r.correctedPeriods}
                      />
                      <RequestApproverStatesPanel states={r.approverStates} compact className="border-0 bg-transparent p-0" />
                    </EntityActionCard>
                  ))}
                </EntityActionCardGrid>
              ) : (
                <DataTable
                  variant="directory"
                  alwaysShowTable
                  tableClassName="min-w-[1200px]"
                  columns={columns}
                  data={pageItems}
                  keyExtractor={(r) => r.id}
                  emptyText="لا توجد طلبات"
                  onRowClick={(r) => setDetailRow(r)}
                />
              )
            )}
          </DirectoryPagedViews>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>طلب تصحيح حضور</DialogTitle>
              <DialogDescription>
                أدخل الموظف وتاريخ التصحيح والأوقات المصححة وسبب الطلب.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <FormField label="الموظف مقدّم الطلب">
                <Select value={formEmpId} onValueChange={setFormEmpId}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف…" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="نوع الطلب">
                <Select value={formRequestTypeId} onValueChange={setFormRequestTypeId}>
                  <SelectTrigger><SelectValue placeholder="اختر نوع الطلب…" /></SelectTrigger>
                  <SelectContent>
                    {attendanceRequestTypes.length === 0 ? (
                      <SelectItem value="__none__" disabled>لا توجد أنواع طلبات للحضور — أضفها من إعدادات أنواع الطلبات</SelectItem>
                    ) : (
                      attendanceRequestTypes.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id}>{rt.nameAr}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="تاريخ التصحيح">
                <DatePickerInput value={formWorkDate} onChange={setFormWorkDate} />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الحضور الجديد</Label>
                  <ModernTimePicker value={formCorrIn} onChange={setFormCorrIn} placeholder="اختر الوقت" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الانصراف الجديد  </Label>
                  <ModernTimePicker value={formCorrOut} onChange={setFormCorrOut} placeholder="اختر الوقت" />
                </div>
              </div>
              <FormField label="سبب الطلب (اختياري)">
                <Textarea value={formReason} onChange={(e) => setFormReason(e.target.value)} rows={3} placeholder="تفاصيل إضافية للمراجع…" />
              </FormField>
            </div>
            <DialogFooter className={dialogFormFooterClass}>
              <Button type="submit" variant="luxe">تسجيل الطلب</Button>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>إلغاء</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailRow != null} onOpenChange={(o) => !o && setDetailRow(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب تصحيح الحضور</DialogTitle>
          </DialogHeader>
          {detailRow ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">الموظف</p><p className="text-sm font-medium">{detailRow.employeeNameAr}</p></div>
                <div><p className="text-xs text-muted-foreground">القسم</p><p className="text-sm font-medium">{detailRow.departmentNameAr || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">نوع الطلب</p><p className="text-sm font-medium">{detailRow.requestTypeNameAr}</p></div>
                <div><p className="text-xs text-muted-foreground">تاريخ التصحيح</p><p className="text-sm font-medium"><TableDateCell value={detailRow.workDate} /></p></div>
                <div><p className="text-xs text-muted-foreground">الحالة السابقة</p><p className="text-sm font-medium">{detailRow.previousStatusAr}</p></div>
                <div><p className="text-xs text-muted-foreground">حالة الطلب</p><p className="text-sm font-medium">{attendanceCorrectionStatusLabelAr(detailRow.status)}</p></div>
                <div><p className="text-xs text-muted-foreground">تاريخ التقديم</p><p className="text-sm font-medium"><TableDateCell value={detailRow.submittedAt} mode="datetime" /></p></div>
                <CorrectionTimesComparisonDetail
                  previousCheckIn={detailRow.previousCheckIn}
                  previousCheckOut={detailRow.previousCheckOut}
                  correctedPeriods={detailRow.correctedPeriods}
                />
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">السبب</p><p className="text-sm">{detailRow.reasonAr || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">ملاحظات القرار</p><p className="text-sm">{detailRow.decisionNotesAr || '—'}</p></div>
              </div>
              <RequestApproverStatesPanel states={detailRow.approverStates} />
              {canShowApprovalActions(detailRow) ? (
                <RequestApprovalActionButtons
                  states={detailRow.approverStates}
                  currentEmployeeId={currentEmployeeId}
                  onApprove={() => void handleApprove(detailRow)}
                  onReject={() => void handleReject(detailRow)}
                />
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

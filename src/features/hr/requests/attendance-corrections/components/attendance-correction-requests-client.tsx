'use client';

import * as React from 'react';
import { Ban, CheckCircle2, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { correctionRequestsApi } from '@/features/hr/requests/lib/api/correction-requests';
import { mapCorrectionRequest } from '@/features/hr/requests/lib/attendance-correction-store';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { FormField, EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  useAttendanceCorrectionRequestsStore,
  attendanceCorrectionStatusLabelAr,
} from '@/features/hr/requests/lib/attendance-correction-store';
import type { AttendanceCorrectionRequest } from '@/features/hr/requests/lib/attendance-correction-store';
import { cn } from '@/shared/utils';

const STATUS_ORDER: readonly string[] = ['pending', 'approved', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الموافقة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

function to12h(t: string): string {
  if (!t) return '—';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  if (isNaN(h)) return t;
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function timeCell(a: string, b: string, labelA: string, labelB: string) {
  return (
    <div className="text-xs leading-relaxed space-y-0.5">
      <p>
        <span className="text-muted-foreground">{labelA}:</span>{' '}
        <span className="font-mono tabular-nums">{to12h(a)}</span>
      </p>
      <p>
        <span className="text-muted-foreground">{labelB}:</span>{' '}
        <span className="font-mono tabular-nums">{to12h(b)}</span>
      </p>
    </div>
  );
}

function statusBadgeClass(s: AttendanceCorrectionRequest['status']) {
  if (s === 'pending') return 'bg-gold/15 text-gold border-gold/30';
  if (s === 'approved') return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

export function AttendanceCorrectionRequestsClient() {
  const companyId = useDefaultCompanyId();
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

  const [appliedDept, setAppliedDept] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formRequestTypeId, setFormRequestTypeId] = React.useState('');
  const [formWorkDate, setFormWorkDate] = React.useState('');
  const [formCorrIn, setFormCorrIn] = React.useState('');
  const [formCorrOut, setFormCorrOut] = React.useState('');
  const [formReason, setFormReason] = React.useState('');
  const [detailRow, setDetailRow] = React.useState<AttendanceCorrectionRequest | null>(null);

  const deptOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...departments.filter((d) => d.isActive).map((d) => ({ value: d.id, label: d.nameAr }))],
    [departments],
  );

  const empPickerList = React.useMemo(
    () => activeEmployees.map((e) => ({ id: e.id, name: e.nameAr })),
    [activeEmployees],
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
      <div className="flex items-center gap-2">
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
      <EntityFilterToolbar
        inlineSelects={[
          {
            id: 'dept',
            value: appliedDept,
            onChange: setAppliedDept,
            placeholder: 'القسم',
            options: deptOptions,
          },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS}
        statusCounts={statusCounts}
        onDateBoundsChange={setDateBounds}
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
      empPickerList,
      openNew,
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
        render: (r) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{r.reasonAr || '—'}</span>,
      },
      {
        key: 'prevTimes',
        title: 'قبل التصحيح',
        render: (r) => timeCell(r.previousCheckIn, r.previousCheckOut, 'حضور', 'انصراف'),
      },
      {
        key: 'corrTimes',
        title: 'بعد التصحيح',
        render: (r) => timeCell(r.correctedCheckIn, r.correctedCheckOut, 'حضور', 'انصراف'),
      },
      {
        key: 'workDate',
        title: 'تاريخ التصحيح',
        render: (r) => <TableDateCell value={r.workDate} />,
      },
      {
        key: 'actions',
        title: 'إجراء',
        isActions: true,
        render: (r) => {
          if (r.status !== 'pending') {
            return <TableDateCell value={r.decidedAt} mode="datetime" />;
          }
          return (
            <TableRowActions
              primaryActions={[
                {
                  label: 'موافقة',
                  variant: 'success',
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  onClick: () => void approve(r.id).then(async () => { toast.success('تم اعتماد طلب التصحيح.'); await reloadList(); }),
                },
                {
                  label: 'رفض',
                  variant: 'destructive',
                  icon: <XCircle className="h-3.5 w-3.5" />,
                  onClick: () => void reject(r.id).then(async () => { toast.message('تم رفض الطلب.'); await reloadList(); }),
                },
              ]}
              menuItems={[
                {
                  label: 'إلغاء',
                  onClick: () => void cancel(r.id).then(async () => { toast.message('تم سحب الطلب.'); await reloadList(); }),
                  icon: <Ban className="h-3.5 w-3.5" />,
                  separator: true,
                },
              ]}
            />
          );
        },
      },
    ],
    [approve, reject, cancel],
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
          <DataTable
            columns={columns}
            data={pageItems}
            keyExtractor={(r) => r.id}
            emptyText="لا توجد طلبات"
            onRowClick={(r) => setDetailRow(r)}
            mobileCard={(r) => (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{r.employeeNameAr}</span>
                  <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px]', statusBadgeClass(r.status))}>
                    {attendanceCorrectionStatusLabelAr(r.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">{r.workDate}</p>
                <p className="text-xs"><span className="text-muted-foreground">نوع الطلب:</span> {r.requestTypeNameAr}{r.subtypeNameAr ? ` — ${r.subtypeNameAr}` : ''}</p>
                {timeCell(r.previousCheckIn, r.previousCheckOut, 'سابق حضور', 'سابق انصراف')}
                {timeCell(r.correctedCheckIn, r.correctedCheckOut, 'مصحح حضور', 'مصحح انصراف')}
                <p className="text-xs"><span className="text-muted-foreground">الحالة السابقة:</span> {r.previousStatusAr}</p>
                {r.status === 'pending' ? (
                  <div className="flex gap-2 pt-1" onClick={(ev) => ev.stopPropagation()}>
                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={async () => { await approve(r.id); toast.success('تم اعتماد طلب التصحيح.'); }}>موافقة</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs text-destructive" onClick={async () => { await reject(r.id); toast.message('تم رفض الطلب.'); }}>رفض</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs text-amber-600" onClick={async (ev) => { ev.stopPropagation(); await cancel(r.id); toast.message('تم سحب الطلب.'); }}>إلغاء</Button>
                  </div>
                ) : null}
              </div>
            )}
          />
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
                  <Input type="time" value={formCorrIn} onChange={(e) => setFormCorrIn(e.target.value)} step={60} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الانصراف الجديد  </Label>
                  <Input type="time" value={formCorrOut} onChange={(e) => setFormCorrOut(e.target.value)} step={60} dir="ltr" />
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

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل طلب تصحيح الحضور"
        fields={detailRow ? [
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'القسم', value: detailRow.departmentNameAr || '—' },
          { label: 'نوع الطلب', value: detailRow.requestTypeNameAr },
          { label: 'تاريخ التصحيح', value: <TableDateCell value={detailRow.workDate} /> },
          { label: 'الحالة السابقة', value: detailRow.previousStatusAr },
          { label: 'حالة الطلب', value: attendanceCorrectionStatusLabelAr(detailRow.status) },
          { label: 'حضور سابق', value: to12h(detailRow.previousCheckIn) },
          { label: 'انصراف سابق', value: to12h(detailRow.previousCheckOut) },
          { label: 'حضور مصحح', value: to12h(detailRow.correctedCheckIn) },
          { label: 'انصراف مصحح', value: to12h(detailRow.correctedCheckOut) },
          { label: 'السبب', value: detailRow.reasonAr || '—' },
          { label: 'ملاحظات القرار', value: detailRow.decisionNotesAr || '—' },
          { label: 'تاريخ التقديم', value: <TableDateCell value={detailRow.createdAt} mode="datetime" /> },
          { label: 'تاريخ القرار', value: <TableDateCell value={detailRow.decidedAt} mode="datetime" /> },
        ] : []}
      />
    </div>
  );
}

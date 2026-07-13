'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { ensurePaginatedResult, fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { intervalOverlapsYmdRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { mapEmployeesToPickerOptions } from '@/features/hr/lib/use-employee-filter-picker';
import type {
  BalanceCreditEmployeeOption,
  BalanceCreditFilterOption,
  LeaveBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/types';
import {
  approveBalanceCreditRequest,
  createBalanceCreditRequest,
  createBulkBalanceCreditRequest,
  mapBalanceCreditResponse,
  type LoadBalanceCreditParams,
  rejectBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/services/balance-credit.service';
import {
  balanceCreditsApi,
  type BalanceCreditRequestResponseDto,
  type BalanceCreditStatus,
} from '@/features/hr/leaves/balance-credit/lib/api/balance-credits';
import { employeeLeaveBalancesApi } from '@/features/hr/leaves/balance-credit/lib/api/employee-leave-balances';
import {
  leaveTypeNameAr,
  loadCompanyLeaveTypes,
  resolveDefaultLeaveTypeId,
} from '@/features/hr/leaves/lib/leave-types-utils';
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';

export type BalanceCreditFetchParams = {
  employeeId?: string;
  status?: BalanceCreditStatus;
};

function creditRequestInDateRange(r: LeaveBalanceCreditRequest, from: string, to: string): boolean {
  const ymd = r.createdAt.slice(0, 10);
  return intervalOverlapsYmdRange(ymd, ymd, from, to);
}

export function useLeaveBalanceCreditModel() {
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);
  const [employeeOptions, setEmployeeOptions] = React.useState<BalanceCreditEmployeeOption[]>([]);
  const [employeePickerOptions, setEmployeePickerOptions] = React.useState<EmployeePickerOption[]>([]);
  const [employeeById, setEmployeeById] = React.useState<Map<string, BalanceCreditEmployeeOption>>(
    () => new Map(),
  );
  const [branchInlineOptions, setBranchInlineOptions] = React.useState<BalanceCreditFilterOption[]>([
    { value: 'all', label: 'جميع الفروع' },
  ]);
  const [deptInlineOptions, setDeptInlineOptions] = React.useState<BalanceCreditFilterOption[]>([
    { value: 'all', label: 'جميع الأقسام' },
  ]);
  const [leaveTypes, setLeaveTypes] = React.useState<{ id: string; nameAr: string }[]>([]);
  const [leaveTypesFull, setLeaveTypesFull] = React.useState<LeaveTypeResponseDto[]>([]);
  const [defaultLeaveTypeId, setDefaultLeaveTypeId] = React.useState<string | null>(null);
  const [defaultLeaveTypeNameAr, setDefaultLeaveTypeNameAr] = React.useState('—');
  const [balancesByEmployeeType, setBalancesByEmployeeType] = React.useState<
    Record<string, Record<string, { used: number; total: number }>>
  >({});
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [metaLoading, setMetaLoading] = React.useState(true);

  const [branchId, setBranchId] = React.useState('all');
  const [departmentId, setDepartmentId] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>({ from: '', to: '' });

  const [addOpen, setAddOpen] = React.useState(false);
  const [formEmployeeIds, setFormEmployeeIds] = React.useState<Set<string>>(new Set());
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [daysAddedRaw, setDaysAddedRaw] = React.useState('');
  const [reasonAr, setReasonAr] = React.useState('');

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);
  const bulkMode =
    selectedEmpIds.size > 1 ||
    branchId !== 'all' ||
    departmentId !== 'all' ||
    dateBounds.from !== '' ||
    dateBounds.to !== '';

  const reloadMeta = React.useCallback(async () => {
    setMetaLoading(true);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);
      const listQuery = cid ? { companyId: cid, limit: 1000 } : { limit: 1000 };

      const [typesRes, balancesRes, employeesRes, branchesRes, departmentsRes] = await Promise.all([
        loadCompanyLeaveTypes(cid ? { companyId: cid, limit: 200, isActive: true } : { limit: 200, isActive: true }),
        employeeLeaveBalancesApi.getAll(listQuery),
        employeesApi.getAll({ ...listQuery, ...organizationActiveListStatusQuery() }),
        cid ? branchesApi.getAll({ companyId: cid, limit: 100, ...organizationActiveListStatusQuery() }) : branchesApi.getAll({ limit: 100, ...organizationActiveListStatusQuery() }),
        cid ? departmentsApi.getAll({ companyId: cid, limit: 200, ...organizationActiveListStatusQuery() }) : departmentsApi.getAll({ limit: 200, ...organizationActiveListStatusQuery() }),
      ]);

      const employees = ensurePaginatedResult(employeesRes);
      const branches = ensurePaginatedResult(branchesRes);
      const departments = ensurePaginatedResult(departmentsRes);
      const balances = ensurePaginatedResult(balancesRes);

      const options: BalanceCreditEmployeeOption[] = employees.items.map((e) => ({
        id: e.id,
        name: e.nameAr?.trim() || e.nameEn?.trim() || '—',
        branchId: e.branchId ?? undefined,
        departmentId: e.departmentId ?? undefined,
      }));

      setEmployeeOptions(options);
      setEmployeePickerOptions(mapEmployeesToPickerOptions(employees.items));
      setEmployeeById(new Map(options.map((e) => [e.id, e])));
      setBranchInlineOptions([
        { value: 'all', label: 'جميع الفروع' },
        ...branches.items.map((b) => ({ value: b.id, label: b.nameAr })),
      ]);
      setDeptInlineOptions([
        { value: 'all', label: 'جميع الأقسام' },
        ...departments.items.map((d) => ({ value: d.id, label: d.nameAr })),
      ]);

      const ltItems = typesRes.items;
      setLeaveTypesFull(ltItems);
      setLeaveTypes(ltItems.map((t) => ({ id: t.id, nameAr: t.nameAr })));
      const defId = typesRes.defaultLeaveTypeId ?? resolveDefaultLeaveTypeId(ltItems);
      setDefaultLeaveTypeId(defId);
      setDefaultLeaveTypeNameAr(leaveTypeNameAr(ltItems, defId));

      const balancesMap: Record<string, Record<string, { used: number; total: number }>> = {};
      for (const group of balances.items) {
        balancesMap[group.employeeId] ??= {};
        for (const row of group.leaveTypes) {
          balancesMap[group.employeeId][row.leaveTypeId] = {
            used: row.usedDays,
            total: row.totalDays,
          };
        }
      }
      setBalancesByEmployeeType(balancesMap);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'balance-credits.load');
      setListError(displayMessage);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reloadMeta();
  }, [reloadMeta]);

  const buildListQuery = React.useCallback(
    (page: number, pageSize: number) => ({
      ...(companyId ? { companyId } : {}),
      page,
      limit: pageSize,
      ...(selectedEmpIds.size === 1 ? { employeeId: [...selectedEmpIds][0] } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter as BalanceCreditStatus } : {}),
    }),
    [companyId, selectedEmpIds, statusFilter],
  );

  const applyClientFilters = React.useCallback(
    (items: LeaveBalanceCreditRequest[]) =>
      items.filter((r) => {
        const emp = employeeById.get(r.employeeId);
        if (selectedEmpIds.size > 0 && !selectedEmpIds.has(r.employeeId)) return false;
        if (branchId !== 'all' && emp?.branchId && emp.branchId !== branchId) return false;
        if (departmentId !== 'all' && emp?.departmentId && emp.departmentId !== departmentId) return false;
        if (!creditRequestInDateRange(r, dateBounds.from, dateBounds.to)) return false;
        return true;
      }),
    [branchId, dateBounds.from, dateBounds.to, departmentId, employeeById, selectedEmpIds],
  );

  const mapRows = React.useCallback(
    (rows: BalanceCreditRequestResponseDto[]) => {
      const employeeNames = new Map(employeeOptions.map((e) => [e.id, e.name] as const));
      return rows.map((row) => mapBalanceCreditResponse(row, employeeNames, leaveTypesFull));
    },
    [employeeOptions, leaveTypesFull],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as LeaveBalanceCreditRequest[], total: 0 };
    setListError(null);
    try {
      const res = await balanceCreditsApi.getAll(buildListQuery(page, pageSize));
      const mapped = mapRows(res.items);
      const items = applyClientFilters(mapped);
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'balance-credits.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [applyClientFilters, buildListQuery, companyId, mapRows]);

  const loadBulk = React.useCallback(async () => {
    if (!companyId) return { items: [] as LeaveBalanceCreditRequest[], total: 0 };
    setListError(null);
    try {
      const res = await fetchAllPaginatedItems((page, limit) =>
        balanceCreditsApi.getAll(buildListQuery(page, limit)),
      );
      const mapped = mapRows(res.items);
      const items = applyClientFilters(mapped).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setApiAccessDenied(false);
      return { items, total: items.length };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'balance-credits.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [applyClientFilters, buildListQuery, companyId, mapRows]);

  const {
    items: sortedRequests,
    loading: listLoading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<LeaveBalanceCreditRequest>(loadPage, {
    enabled: !!companyId && !metaLoading,
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [companyId, branchId, departmentId, statusFilter, selectedEmpKey, dateBounds.from, dateBounds.to],
  });

  const loading = metaLoading || listLoading;

  const reload = React.useCallback(async (_params?: LoadBalanceCreditParams) => {
    await Promise.all([reloadMeta(), reloadList()]);
  }, [reloadList, reloadMeta]);

  const baseFiltered = React.useMemo(() => sortedRequests, [sortedRequests]);

  const statusCounts = React.useMemo(
    () => ({
      all: pagination.total,
      pending: baseFiltered.filter((r) => r.status === 'pending').length,
      approved: baseFiltered.filter((r) => r.status === 'approved').length,
      rejected: baseFiltered.filter((r) => r.status === 'rejected').length,
    }),
    [baseFiltered, pagination.total],
  );

  const resetAddForm = React.useCallback(() => {
    setFormEmployeeIds(new Set());
    setLeaveTypeId(defaultLeaveTypeId ?? '');
    setDaysAddedRaw('');
    setReasonAr('');
  }, [defaultLeaveTypeId]);

  const openAddDialog = React.useCallback((prefillEmployeeIds?: Iterable<string>) => {
    const nextIds = prefillEmployeeIds ? new Set(prefillEmployeeIds) : new Set<string>();
    setFormEmployeeIds(nextIds);
    setLeaveTypeId(defaultLeaveTypeId ?? '');
    setDaysAddedRaw('');
    setReasonAr('');
    setAddOpen(true);
  }, [defaultLeaveTypeId]);

  const openAddForEmployee = React.useCallback((id: string) => {
    openAddDialog([id]);
  }, [openAddDialog]);

  const handleDialogSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formEmployeeIds.size === 0) {
        toast.error('اختر موظفاً واحداً على الأقل.');
        return;
      }
      if (!companyId || !leaveTypeId) {
        toast.error('تعذر تحديد الشركة أو نوع الإجازة.');
        return;
      }
      const days = Number.parseInt(daysAddedRaw.trim(), 10);
      if (!Number.isFinite(days) || days < 1) {
        toast.error('عدد الأيام يجب أن يكون 1 على الأقل.');
        return;
      }

      const reason = reasonAr.trim() || null;
      const employeeIds = [...formEmployeeIds];

      try {
        if (employeeIds.length === 1) {
          await createBalanceCreditRequest({
            companyId,
            employeeId: employeeIds[0]!,
            leaveTypeId,
            daysAdded: days,
            reasonAr: reason,
            status: 'pending',
            createdBy,
          });
          toast.success('تم تسجيل الطلب — في الانتظار للموافقة.');
        } else {
          const res = await createBulkBalanceCreditRequest({
            companyId,
            employeeIds,
            leaveTypeId,
            daysAdded: days,
            reasonAr: reason,
            status: 'pending',
            createdBy,
          });
          const count = res.items?.length ?? employeeIds.length;
          toast.success(`تم تسجيل ${count} طلب — في الانتظار للموافقة.`);
        }
        resetAddForm();
        setAddOpen(false);
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.create');
        toast.error(displayMessage);
      }
    },
    [companyId, createdBy, daysAddedRaw, formEmployeeIds, leaveTypeId, reasonAr, reload, resetAddForm],
  );

  const approveCreditRequest = React.useCallback(
    async (id: string) => {
      try {
        await approveBalanceCreditRequest(id);
        toast.success('تمت الموافقة على الطلب وتحديث الرصيد.');
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.approve');
        toast.error(displayMessage);
      }
    },
    [reload],
  );

  const rejectCreditRequest = React.useCallback(
    async (id: string) => {
      try {
        await rejectBalanceCreditRequest(id);
        toast.message('تم رفض الطلب.');
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.reject');
        toast.error(displayMessage);
      }
    },
    [reload],
  );

  const singleFormEmployeeId = formEmployeeIds.size === 1 ? [...formEmployeeIds][0]! : '';
  const selectedBalance = singleFormEmployeeId && leaveTypeId
    ? balancesByEmployeeType[singleFormEmployeeId]?.[leaveTypeId] ?? null
    : null;

  const selectedLeaveTypeNameAr = React.useMemo(
    () => leaveTypes.find((t) => t.id === leaveTypeId)?.nameAr ?? defaultLeaveTypeNameAr,
    [leaveTypes, leaveTypeId, defaultLeaveTypeNameAr],
  );

  return {
    loading,
    listError,
    accessDenied: apiAccessDenied,
    sortedRequests,
    pagination,
    leaveTypes,
    defaultLeaveTypeNameAr,
    selectedBalance,
    selectedLeaveTypeNameAr,
    companyId,
    branchId,
    setBranchId,
    departmentId,
    setDepartmentId,
    selectedEmpIds,
    setSelectedEmpIds,
    statusFilter,
    setStatusFilter,
    dateBounds,
    setDateBounds,
    branchInlineOptions,
    deptInlineOptions,
    employeeOptions,
    employeePickerOptions,
    selectedEmpKey,
    statusCounts,
    addOpen,
    setAddOpen,
    formEmployeeIds,
    setFormEmployeeIds,
    leaveTypeId,
    setLeaveTypeId,
    daysAddedRaw,
    setDaysAddedRaw,
    reasonAr,
    setReasonAr,
    resetAddForm,
    openAddDialog,
    openAddForEmployee,
    handleDialogSubmit,
    approveCreditRequest,
    rejectCreditRequest,
  };
}

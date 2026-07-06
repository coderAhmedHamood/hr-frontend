'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  leaveRequestsNewApi,
  type ApiLeaveRequest,
  type LeaveRequestStatusNew,
} from '@/features/hr/requests/lib/api/correction-requests';
import {
  leaveBalancesApi,
  flattenLeaveBalanceGroups,
  type EmployeeLeaveBalanceResponseDto,
} from '@/features/hr/leaves/lib/api/leave-balances';
import {
  leaveRequestTypesFromHistory,
  loadLeaveRequestTypes,
} from '@/features/hr/requests/lib/load-leave-request-types';
import type { ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { AR_LEAVE_STATUS_LABELS } from '@/shared/i18n/ar';

export type EmployeeProfileLeaveTypeOption = {
  id: string;
  nameAr: string;
  code: string;
};

export type { ApiLeaveRequest as LeaveRequestResponseDto, EmployeeLeaveBalanceResponseDto };

export type EmployeeLeaveBalanceCard = {
  leaveTypeId: string;
  title: string;
  code: string;
  year: number;
  entitled: number;
  used: number;
  available: number;
  yearEnd: number;
  accent: 'success' | 'primary';
  hasBalanceRow: boolean;
};

export type EmployeeLeaveSummary = {
  totalEntitled: number;
  totalUsed: number;
  totalAvailable: number;
  pendingCount: number;
  approvedCount: number;
  requestCount: number;
};

export type LeaveTypeFilter = 'all' | string;
export type LeaveStatusFilter = 'all' | LeaveRequestStatusNew;

const ACCENT_BY_CODE: Record<string, 'success' | 'primary'> = {
  annual: 'success',
  sick: 'primary',
};

const LEAVE_STATUS_LABELS: Record<LeaveRequestStatusNew, string> = AR_LEAVE_STATUS_LABELS;

export function useEmployeeProfileLeave(employee: Employee, enabled = true) {
  const companyId = getDefaultCompanyId() ?? '';

  const [totalLeaveRequestCount, setTotalLeaveRequestCount] = React.useState(0);
  const [leaveBalances, setLeaveBalances] = React.useState<EmployeeLeaveBalanceResponseDto[]>([]);
  const [leaveRequestTypes, setLeaveRequestTypes] = React.useState<ApiRequestType[]>([]);
  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);
  const [presetLeaveTypeId, setPresetLeaveTypeId] = React.useState<string | null>(null);
  const [leavesLoading, setLeavesLoading] = React.useState(false);
  const [leavesError, setLeavesError] = React.useState<string | null>(null);
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState<LeaveTypeFilter>('all');
  const [leaveStatusFilter, setLeaveStatusFilter] = React.useState<LeaveStatusFilter>('all');

  const reloadLeaves = React.useCallback(async () => {
    if (!employee.id || !enabled) return;
    setLeavesLoading(true);
    setLeavesError(null);
    try {
      const scopedCompanyId = companyId || undefined;
      const [countRes, balRes, catalogRequestTypes] = await Promise.all([
        leaveRequestsNewApi.list({
          employeeId: employee.id,
          companyId: scopedCompanyId,
          limit: 1,
        }),
        leaveBalancesApi.getAll({
          employeeId: employee.id,
          companyId: scopedCompanyId,
          limit: 50,
        }),
        scopedCompanyId ? loadLeaveRequestTypes(scopedCompanyId) : Promise.resolve([] as ApiRequestType[]),
      ]);

      setTotalLeaveRequestCount(countRes.pagination?.total ?? countRes.items.length);
      setLeaveBalances(flattenLeaveBalanceGroups(balRes.items));
      setLeaveRequestTypes(
        catalogRequestTypes.length > 0
          ? catalogRequestTypes
          : leaveRequestTypesFromHistory([]),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-profile.leaves');
      setLeavesError(displayMessage);
      setTotalLeaveRequestCount(0);
      setLeaveBalances([]);
    } finally {
      setLeavesLoading(false);
    }
  }, [companyId, employee.id, enabled]);

  React.useEffect(() => {
    void reloadLeaves();
  }, [reloadLeaves]);

  const loadLeaveRequestsPage = React.useCallback(async (page: number, pageSize: number) => {
    const scopedCompanyId = companyId || undefined;
    const res = await leaveRequestsNewApi.list({
      employeeId: employee.id,
      companyId: scopedCompanyId,
      page,
      limit: pageSize,
      ...(leaveTypeFilter !== 'all' ? { leaveTypeId: leaveTypeFilter } : {}),
      ...(leaveStatusFilter !== 'all' ? { status: leaveStatusFilter } : {}),
    });
    return {
      items: res.items,
      total: res.pagination?.total ?? res.items.length,
    };
  }, [companyId, employee.id, leaveTypeFilter, leaveStatusFilter]);

  const {
    items: filteredLeaveRequests,
    loading: leaveRequestsLoading,
    pagination: leaveRequestsPagination,
    reload: reloadLeaveRequests,
  } = useServerDirectoryPagination<ApiLeaveRequest>(loadLeaveRequestsPage, {
    enabled: enabled && !!employee.id,
    resetDeps: [employee.id, companyId, leaveTypeFilter, leaveStatusFilter],
  });

  const reloadLeavesAndRequests = React.useCallback(async () => {
    await reloadLeaves();
    await reloadLeaveRequests();
  }, [reloadLeaves, reloadLeaveRequests]);

  const leaveTypes = React.useMemo((): EmployeeProfileLeaveTypeOption[] => {
    const byTypeId = new Map<string, EmployeeProfileLeaveTypeOption>();
    for (const balance of leaveBalances) {
      if (byTypeId.has(balance.leaveTypeId)) continue;
      byTypeId.set(balance.leaveTypeId, {
        id: balance.leaveTypeId,
        nameAr: balance.leaveTypeNameAr ?? 'إجازة',
        code: balance.leaveTypeCode ?? '',
      });
    }
    return [...byTypeId.values()].sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  }, [leaveBalances]);

  const leaveBalanceCards = React.useMemo((): EmployeeLeaveBalanceCard[] => {
    const year = new Date().getFullYear();

    return leaveBalances.map((bal) => {
      const code = bal.leaveTypeCode ?? '';
      return {
        leaveTypeId: bal.leaveTypeId,
        title: bal.leaveTypeNameAr ?? 'إجازة',
        code,
        year,
        entitled: bal.totalDays,
        used: bal.usedDays,
        available: bal.remainingDays,
        yearEnd: bal.remainingDays,
        accent: ACCENT_BY_CODE[code] ?? 'primary',
        hasBalanceRow: true,
      };
    }).sort((a, b) => a.title.localeCompare(b.title, 'ar'));
  }, [leaveBalances]);

  const leaveSummary = React.useMemo((): EmployeeLeaveSummary => {
    const pendingCount = filteredLeaveRequests.filter((r) => r.status === 'pending').length;
    const approvedCount = filteredLeaveRequests.filter((r) => r.status === 'approved').length;
    return {
      totalEntitled: leaveBalanceCards.reduce((s, c) => s + c.entitled, 0),
      totalUsed: leaveBalanceCards.reduce((s, c) => s + c.used, 0),
      totalAvailable: leaveBalanceCards.reduce((s, c) => s + c.available, 0),
      pendingCount,
      approvedCount,
      requestCount: totalLeaveRequestCount,
    };
  }, [leaveBalanceCards, filteredLeaveRequests, totalLeaveRequestCount]);

  const hasLeaveFilters = leaveTypeFilter !== 'all' || leaveStatusFilter !== 'all';

  const openLeaveRequest = React.useCallback((leaveTypeId?: string) => {
    setPresetLeaveTypeId(leaveTypeId ?? null);
    setLeaveRequestOpen(true);
  }, []);

  const leaveTypeFilterOptions = React.useMemo(
    () => [
      { value: 'all' as const, label: 'كل أنواع الإجازة' },
      ...leaveTypes.map((t) => ({ value: t.id, label: t.nameAr })),
    ],
    [leaveTypes],
  );

  const leaveStatusFilterOptions = React.useMemo(
    () => [
      { value: 'all' as const, label: 'كل الحالات' },
      ...(Object.entries(LEAVE_STATUS_LABELS) as [LeaveRequestStatusNew, string][]).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  return {
    companyId,
    totalLeaveRequestCount,
    filteredLeaveRequests,
    leaveRequestsLoading,
    leaveRequestsPagination,
    hasLeaveFilters,
    leaveBalances,
    leaveTypes,
    leaveRequestTypes,
    leaveBalanceCards,
    leaveSummary,
    leaveTypeFilter,
    setLeaveTypeFilter,
    leaveStatusFilter,
    setLeaveStatusFilter,
    leaveTypeFilterOptions,
    leaveStatusFilterOptions,
    leaveStatusLabels: LEAVE_STATUS_LABELS,
    leaveRequestOpen,
    setLeaveRequestOpen,
    presetLeaveTypeId,
    openLeaveRequest,
    leavesLoading,
    leavesError,
    reloadLeaves: reloadLeavesAndRequests,
  };
}

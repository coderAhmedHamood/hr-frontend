'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  employeeProfileApi,
  type AuditChangeSummaryDto,
  type AuditEntityScope,
} from '@/features/hr/organization/employees/lib/api/employee-profile';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { PeriodRange } from '@/components/ui/list-filter-bar';

export type AuditScopeFilter = 'all' | AuditEntityScope;
export type AuditActionFilter = 'all' | string;

const EMPTY_COUNTS = {
  total: 0,
  byAction: {} as Record<string, number>,
  byScope: {} as Record<string, number>,
  byEntityName: {} as Record<string, number>,
  bySeverity: {} as Record<string, number>,
};

const EMPTY_DATE_RANGE: PeriodRange = { from: '', to: '' };

export function useEmployeeProfileAuditLog(employee: Employee, listEnabled = true) {
  const [auditError, setAuditError] = React.useState<string | null>(null);
  const [auditCounts, setAuditCounts] = React.useState(EMPTY_COUNTS);
  const [scopeFilter, setScopeFilter] = React.useState<AuditScopeFilter>('all');
  const [actionFilter, setActionFilter] = React.useState<AuditActionFilter>('all');
  const [dateRange, setDateRange] = React.useState<PeriodRange>(EMPTY_DATE_RANGE);

  React.useEffect(() => {
    if (!employee.id) return;
    let cancelled = false;
    void employeeProfileApi
      .getAudit(employee.id, { page: 1, pageSize: 1 })
      .then((res) => {
        if (!cancelled) setAuditCounts(res.counts ?? EMPTY_COUNTS);
      })
      .catch(() => {
        if (!cancelled) setAuditCounts(EMPTY_COUNTS);
      });
    return () => {
      cancelled = true;
    };
  }, [employee.id]);

  const loadAuditPage = React.useCallback(
    async (page: number, pageSize: number) => {
      setAuditError(null);
      try {
        const res = await employeeProfileApi.getAudit(employee.id, {
          page,
          pageSize,
          ...(scopeFilter !== 'all' ? { scope: scopeFilter } : {}),
          ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
          ...(dateRange.from ? { from: dateRange.from } : {}),
          ...(dateRange.to ? { to: dateRange.to } : {}),
        });
        setAuditCounts(res.counts ?? EMPTY_COUNTS);
        return {
          items: res.changes ?? [],
          total: res.pagination?.total ?? res.changes?.length ?? 0,
        };
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'employee-profile.audit');
        setAuditError(displayMessage);
        return { items: [] as AuditChangeSummaryDto[], total: 0 };
      }
    },
    [employee.id, scopeFilter, actionFilter, dateRange.from, dateRange.to],
  );

  const {
    items: auditChanges,
    loading: auditLoading,
    pagination: auditPagination,
    total: auditTotal,
    reload: reloadAudit,
  } = useServerDirectoryPagination<AuditChangeSummaryDto>(loadAuditPage, {
    enabled: listEnabled && !!employee.id,
    resetDeps: [employee.id, scopeFilter, actionFilter, dateRange.from, dateRange.to],
  });

  const hasAuditFilters =
    scopeFilter !== 'all' ||
    actionFilter !== 'all' ||
    !!dateRange.from ||
    !!dateRange.to;

  return {
    auditChanges,
    auditLoading,
    auditPagination,
    auditTotal,
    auditCounts,
    auditError,
    scopeFilter,
    setScopeFilter,
    actionFilter,
    setActionFilter,
    dateRange,
    setDateRange,
    hasAuditFilters,
    reloadAudit,
  };
}

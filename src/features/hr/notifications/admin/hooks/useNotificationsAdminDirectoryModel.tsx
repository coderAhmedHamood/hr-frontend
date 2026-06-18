'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import {
  notificationsApi,
  type NotificationCategory,
  type NotificationSeverity,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import type { HRAdminNotificationRecord } from '@/features/hr/notifications/admin/constants/notification-labels';
import {
  mapSentNotification,
  NOTIFICATION_AUDIENCE_LABELS,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import type { NotificationAudienceKind } from '@/features/hr/notifications/lib/api/notifications';

const REFERENCE_LIMIT = 200;
const DEFAULT_LIMIT = 30;

export type NotificationsAdminFilters = {
  category: 'all' | NotificationCategory;
  severity: 'all' | NotificationSeverity;
  excludeExpired: boolean;
  sourceKind: string;
  sourceTable: string;
  sourceId: string;
};

const DEFAULT_FILTERS: NotificationsAdminFilters = {
  category: 'all',
  severity: 'all',
  excludeExpired: true,
  sourceKind: '',
  sourceTable: '',
  sourceId: '',
};

function audienceSummaryFromSnapshot(
  kind: NotificationAudienceKind,
  snapshot: Record<string, unknown> | null,
): string {
  if (snapshot && typeof snapshot.summaryAr === 'string' && snapshot.summaryAr) {
    return snapshot.summaryAr;
  }
  return NOTIFICATION_AUDIENCE_LABELS[kind] ?? kind;
}

function buildListParams(
  companyId: string | null,
  filters: NotificationsAdminFilters,
  dateBounds: { from: string; to: string },
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    ...(companyId ? { companyId } : {}),
    ...(filters.category !== 'all' ? { category: filters.category } : {}),
    ...(filters.severity !== 'all' ? { severity: filters.severity } : {}),
    ...(dateBounds.from ? { from: dateBounds.from } : {}),
    ...(dateBounds.to ? { to: dateBounds.to } : {}),
    ...(filters.excludeExpired ? { excludeExpired: true } : {}),
    ...(filters.sourceKind.trim() ? { sourceKind: filters.sourceKind.trim() } : {}),
    ...(filters.sourceTable.trim() ? { sourceTable: filters.sourceTable.trim() } : {}),
    ...(filters.sourceId.trim() ? { sourceId: filters.sourceId.trim() } : {}),
  };
}

export function useNotificationsAdminDirectoryModel() {
  const [notifications, setNotifications] = React.useState<HRAdminNotificationRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(DEFAULT_LIMIT);
  const [filters, setFilters] = React.useState<NotificationsAdminFilters>(DEFAULT_FILTERS);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [branchOptions, setBranchOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<{
    value: string;
    label: string;
    branchId?: string;
    branchNameAr?: string;
    departmentId?: string;
    departmentNameAr?: string;
  }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [referenceLoaded, setReferenceLoaded] = React.useState(false);

  const loadReferenceData = React.useCallback(async () => {
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      setCompanyId(resolvedCompanyId);

      const [branchesRes, departmentsRes, employeesRes] = await Promise.all([
        branchesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: REFERENCE_LIMIT } : { limit: REFERENCE_LIMIT },
        ),
        departmentsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: REFERENCE_LIMIT } : { limit: REFERENCE_LIMIT },
        ),
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: REFERENCE_LIMIT } : { limit: REFERENCE_LIMIT },
        ),
      ]);

      setBranchOptions(
        ensurePaginatedResult(branchesRes).items.map((b) => ({ value: b.id, label: b.nameAr })),
      );
      setDepartmentOptions(
        ensurePaginatedResult(departmentsRes).items.map((d) => ({ value: d.id, label: d.nameAr })),
      );
      setEmployeeOptions(
        ensurePaginatedResult(employeesRes).items.map((e) => ({
          value: e.id,
          label: e.nameAr ?? e.nameEn ?? e.id,
          branchId: e.branchId ?? undefined,
          branchNameAr: e.branchNameAr ?? undefined,
          departmentId: e.departmentId ?? undefined,
          departmentNameAr: e.departmentNameAr ?? undefined,
        })),
      );
      setReferenceLoaded(true);
    } catch (e) {
      setListError(handleApiError(e).displayMessage);
      setReferenceLoaded(true);
    }
  }, []);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const notifRes = await notificationsApi.list(
        buildListParams(companyId, filters, dateBounds, page, limit),
      );
      const paginated = ensurePaginatedResult(notifRes);
      setNotifications(
        paginated.items.map((row) =>
          mapSentNotification(
            row,
            audienceSummaryFromSnapshot(row.audienceKind, row.audienceSnapshot),
          ),
        ),
      );
      setTotal(paginated.pagination.total);
    } catch (e) {
      setListError(handleApiError(e).displayMessage);
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, dateBounds, filters, limit, page]);

  React.useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  React.useEffect(() => {
    if (!referenceLoaded) return;
    void loadList();
  }, [loadList, referenceLoaded]);

  React.useEffect(() => {
    setPage(1);
  }, [filters, dateBounds, limit]);

  const patchFilters = React.useCallback((patch: Partial<NotificationsAdminFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const activeFilterCount =
    (filters.category !== 'all' ? 1 : 0)
    + (filters.severity !== 'all' ? 1 : 0)
    + (dateBounds.from || dateBounds.to ? 1 : 0)
    + (!filters.excludeExpired ? 1 : 0)
    + (filters.sourceKind.trim() ? 1 : 0)
    + (filters.sourceTable.trim() ? 1 : 0)
    + (filters.sourceId.trim() ? 1 : 0);

  const clearFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDateBounds({ from: '', to: '' });
  }, []);

  const reload = React.useCallback(async () => {
    await loadList();
  }, [loadList]);

  const sendNotification = React.useCallback(
    async (dto: SendNotificationDto) => {
      await notificationsApi.send(dto);
      await reload();
    },
    [reload],
  );

  const deleteNotification = React.useCallback(
    async (id: string) => {
      await notificationsApi.delete(id);
      await reload();
    },
    [reload],
  );

  return {
    notifications,
    total,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    patchFilters,
    dateBounds,
    setDateBounds,
    activeFilterCount,
    clearFilters,
    companyId,
    branchOptions,
    departmentOptions,
    employeeOptions,
    loading,
    listError,
    reload,
    sendNotification,
    deleteNotification,
  };
}

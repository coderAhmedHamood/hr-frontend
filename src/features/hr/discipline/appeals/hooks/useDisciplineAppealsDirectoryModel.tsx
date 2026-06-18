'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  disciplineAppealsApi,
  type DisciplineAppealResponseDto,
  type CreateDisciplineAppealDto,
  type UpdateDisciplineAppealDto,
  type ProcessDisciplineAppealDecisionDto,
  type AppealChannelDto,
  type AppealStatusDto,
} from '@/features/hr/discipline/lib/api/discipline-appeals';
import type { HRAppealChannel, HRAppealStatus } from '@/features/hr/discipline/lib/types';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  sendAppealDecisionNotification,
  submitAppealDecision,
} from '@/features/hr/discipline/appeals/services/discipline-appeals.service';

export type AppealEmployee = { id: string; nameAr: string };
export type AppealCase = { id: string; caseNumber: string; employeeId: string; employeeNameAr: string };

export type AppealRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  caseId: string;
  caseNumber: string;
  date: string;
  channel: HRAppealChannel;
  status: HRAppealStatus;
  grounds: string;
  responseNote: string;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppealListFilters = {
  selectedEmpIds: string[];
  statusFilter: 'all' | HRAppealStatus;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: AppealListFilters = {
  selectedEmpIds: [],
  statusFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

function mapAppeal(
  dto: DisciplineAppealResponseDto,
  employeesById: Map<string, string>,
): AppealRecord {
  return {
    id: dto.id,
    employeeId: dto.subjectEmployeeId,
    employeeNameAr: employeesById.get(dto.subjectEmployeeId) ?? dto.subjectEmployeeId,
    caseId: dto.violationRecordId,
    caseNumber: dto.linkedViolationRecordNumber,
    date: dto.appealDate,
    channel: (dto.channel ?? 'system') as HRAppealChannel,
    status: dto.status as HRAppealStatus,
    grounds: dto.groundsAr,
    responseNote: dto.responseNote ?? '',
    decidedAt: dto.decidedAt,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

function applyAppealClientFilters(
  appeals: AppealRecord[],
  filters: AppealListFilters,
): AppealRecord[] {
  const selected = new Set(filters.selectedEmpIds);
  return appeals.filter((a) => {
    if (selected.size > 1 && !selected.has(a.employeeId)) return false;
    return matchesDateRange(a.date, filters.dateFrom, filters.dateTo);
  });
}

export function useDisciplineAppealsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<AppealListFilters>(DEFAULT_LIST_FILTERS);
  const [sourceAppeals, setSourceAppeals] = React.useState<AppealRecord[]>([]);
  const [employees, setEmployees] = React.useState<AppealEmployee[]>([]);
  const [cases, setCases] = React.useState<AppealCase[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);

  const employeeMapRef = React.useRef<Map<string, string>>(new Map());
  const companyIdRef = React.useRef<string | null>(null);

  const bulkMode = Boolean(
    listFilters.dateFrom
    || listFilters.dateTo
    || listFilters.selectedEmpIds.length > 1,
  );

  const apiEmployeeId = listFilters.selectedEmpIds.length === 1
    ? listFilters.selectedEmpIds[0]
    : undefined;
  const apiStatus = listFilters.statusFilter !== 'all'
    ? (listFilters.statusFilter as AppealStatusDto)
    : undefined;

  const loadReferenceData = React.useCallback(async () => {
    const scope = await resolveOrganizationScope();
    const cid = scope.companyId ?? null;
    setCompanyId(cid);
    companyIdRef.current = cid;

    const [employeesRes, recordsRes] = await Promise.all([
      employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
      violationRecordsApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
    ]);

    const employeeMap = new Map(employeesRes.items.map((e) => [e.id, e.nameAr]));
    employeeMapRef.current = employeeMap;
    setEmployees(employeesRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    setCases(
      recordsRes.items.map((r) => ({
        id: r.id,
        caseNumber: r.recordNumber,
        employeeId: r.employeeId,
        employeeNameAr: employeeMap.get(r.employeeId) ?? r.employeeId,
      })),
    );
  }, []);

  React.useEffect(() => {
    void loadReferenceData().catch(() => undefined);
  }, [loadReferenceData]);

  const buildAppealsQuery = React.useCallback(
    (page: number, limit: number) => ({
      ...(companyIdRef.current ? { companyId: companyIdRef.current } : {}),
      page,
      limit,
      ...(apiEmployeeId ? { subjectEmployeeId: apiEmployeeId } : {}),
      ...(apiStatus ? { status: apiStatus } : {}),
    }),
    [apiEmployeeId, apiStatus],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await disciplineAppealsApi.getAll(buildAppealsQuery(page, pageSize));
      const items = res.items.map((a) => mapAppeal(a, employeeMapRef.current));
      setSourceAppeals(items);
      const filtered = applyAppealClientFilters(items, listFilters);
      return { items: filtered, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-appeals.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildAppealsQuery, listFilters]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await fetchAllPaginatedItems((page, limit) =>
        disciplineAppealsApi.getAll(buildAppealsQuery(page, limit)),
      );
      const items = res.items.map((a) => mapAppeal(a, employeeMapRef.current));
      setSourceAppeals(items);
      const filtered = applyAppealClientFilters(items, listFilters);
      return { items: filtered, total: filtered.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-appeals.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildAppealsQuery, listFilters]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<AppealRecord>(loadPage, {
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [
      apiEmployeeId,
      apiStatus,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  const filteredItems = React.useMemo(
    () => applyAppealClientFilters(sourceAppeals, listFilters),
    [listFilters, sourceAppeals],
  );

  const createAppeal = React.useCallback(
    async (payload: {
      caseId: string;
      date: string;
      channel: AppealChannelDto;
      grounds: string;
    }) => {
      const cid = companyId ?? companyIdRef.current;
      if (!cid) throw new Error('تعذر تحديد الشركة');
      const dto: CreateDisciplineAppealDto = {
        companyId: cid,
        violationRecordId: payload.caseId,
        appealDate: payload.date,
        groundsAr: payload.grounds,
        channel: payload.channel,
        status: 'pending',
      };
      await disciplineAppealsApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const updateAppeal = React.useCallback(
    async (id: string, patch: UpdateDisciplineAppealDto) => {
      const updatedBy = useAuthStore.getState().user?.email ?? useAuthStore.getState().user?.id ?? undefined;
      await disciplineAppealsApi.update(id, { ...patch, updatedBy });
      await reload();
    },
    [reload],
  );

  const decideAppeal = React.useCallback(
    async (
      appeal: AppealRecord,
      payload: ProcessDisciplineAppealDecisionDto,
    ): Promise<{ notificationSent: boolean }> => {
      const user = useAuthStore.getState().user;
      const decidedBy = user?.email ?? user?.id ?? undefined;
      await submitAppealDecision(appeal.id, { ...payload, decidedBy });

      let notificationSent = false;
      const cid = companyId ?? getDefaultCompanyId();
      if (cid) {
        try {
          await sendAppealDecisionNotification({
            companyId: cid,
            appealId: appeal.id,
            employeeId: appeal.employeeId,
            caseNumber: appeal.caseNumber,
            status: payload.status,
            responseNote: payload.responseNote?.trim() ?? '',
            triggeredByUserId: user?.id,
            triggeredByNameAr: user?.fullNameAr ?? null,
            createdBy: user?.email ?? user?.id ?? null,
          });
          notificationSent = true;
        } catch {
          notificationSent = false;
        }
      }

      await reload();
      return { notificationSent };
    },
    [companyId, reload],
  );

  const deleteAppeal = React.useCallback(
    async (id: string) => {
      await disciplineAppealsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    sourceAppeals,
    employees,
    cases,
    companyId,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    createAppeal,
    updateAppeal,
    decideAppeal,
    deleteAppeal,
    reload,
  };
}

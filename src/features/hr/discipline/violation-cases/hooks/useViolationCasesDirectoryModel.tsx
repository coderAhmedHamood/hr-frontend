'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult, fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import {
  violationRecordsApi,
  type ViolationInvestigationDto,
  type ViolationRecordResponseDto,
  type ViolationRecordStatus,
  type CreateViolationRecordDto,
  type UpdateViolationRecordDto,
  type DecideViolationRecordDto,
} from '@/features/hr/discipline/lib/api/violation-records';

export type ViolationCaseRecord = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
  violationTypeId: string;
  typeNameAr: string;
  typeNeedsWarning: boolean;
  typeNeedsInvestigation: boolean;
  typeNeedsApproval: boolean;
  typeHasDeduction: boolean;
  typeDeductionKind: string | null;
  typeDeductionValue: string | null;
  status: ViolationRecordStatus;
  date: string;
  description: string;
  notes: string | null;
  attachmentsNote: string | null;
  hasInvestigations: boolean;
  decisionNotes: string | null;
  decidedAt: string | null;
  investigations: ViolationInvestigationDto[];
  investigationCount: number;
  latestInvestigationResult: ViolationInvestigationDto['result'] | null;
  latestInvestigationRecommendation: ViolationInvestigationDto['recommendation'];
  createdAt: string;
  updatedAt: string;
};

export type ViolationCaseEmployee = { id: string; nameAr: string };
export type ViolationCaseType = {
  id: string; nameAr: string; code: string; isActive: boolean;
  needsWarning: boolean; needsInvestigation: boolean;
};

export type ViolationCaseListFilters = {
  selectedEmpIds: string[];
  statusFilter: 'all' | ViolationRecordStatus;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: ViolationCaseListFilters = {
  selectedEmpIds: [],
  statusFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

function pickLatestInvestigation(investigations: ViolationInvestigationDto[]): ViolationInvestigationDto | null {
  if (investigations.length === 0) return null;
  return investigations.reduce((latest, current) => {
    const latestTs = Date.parse(latest.updatedAt ?? latest.createdAt ?? '');
    const currentTs = Date.parse(current.updatedAt ?? current.createdAt ?? '');
    if (Number.isNaN(latestTs)) return current;
    if (Number.isNaN(currentTs)) return latest;
    return currentTs >= latestTs ? current : latest;
  });
}

function mapRecord(
  dto: ViolationRecordResponseDto,
  employeesById: Map<string, string>,
  typesById: Map<string, string>,
): ViolationCaseRecord {
  const vt = dto.violationType;
  const investigations = dto.investigations ?? [];
  const latestInvestigation = pickLatestInvestigation(investigations);
  return {
    id: dto.id,
    caseNumber: dto.recordNumber,
    employeeId: dto.employeeId,
    employeeNameAr: employeesById.get(dto.employeeId) ?? dto.employeeId,
    violationTypeId: dto.violationTypeId,
    typeNameAr: vt?.nameAr ?? typesById.get(dto.violationTypeId) ?? dto.violationTypeId,
    typeNeedsWarning: vt?.needsWarning ?? false,
    typeNeedsInvestigation: vt?.needsInvestigation ?? dto.violationTypeNeedsInvestigation ?? false,
    typeNeedsApproval: vt?.needsApproval ?? false,
    typeHasDeduction: vt?.hasDeduction ?? false,
    typeDeductionKind: vt?.deductionKind ?? null,
    typeDeductionValue: vt?.deductionValue ?? null,
    status: dto.status ?? 'pending',
    date: dto.violationDate,
    description: dto.description,
    notes: dto.notes,
    attachmentsNote: dto.attachmentsNote,
    hasInvestigations: dto.hasInvestigations ?? investigations.length > 0,
    decisionNotes: dto.decisionNotes ?? null,
    decidedAt: dto.decidedAt ?? null,
    investigations,
    investigationCount: investigations.length,
    latestInvestigationResult: latestInvestigation?.result ?? null,
    latestInvestigationRecommendation: latestInvestigation?.recommendation ?? null,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

function applyViolationCaseClientFilters(
  cases: ViolationCaseRecord[],
  filters: ViolationCaseListFilters,
): ViolationCaseRecord[] {
  const selected = new Set(filters.selectedEmpIds);
  return cases.filter((c) => {
    if (selected.size > 1 && !selected.has(c.employeeId)) return false;
    if (filters.statusFilter !== 'all' && c.status !== filters.statusFilter) return false;
    return true;
  });
}

export function useViolationCasesDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<ViolationCaseListFilters>(DEFAULT_LIST_FILTERS);
  const [sourceCases, setSourceCases] = React.useState<ViolationCaseRecord[]>([]);
  const [employees, setEmployees] = React.useState<ViolationCaseEmployee[]>([]);
  const [violationTypes, setViolationTypes] = React.useState<ViolationCaseType[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeMapRef = React.useRef<Map<string, string>>(new Map());
  const typeMapRef = React.useRef<Map<string, string>>(new Map());

  const bulkMode = Boolean(
    listFilters.statusFilter !== 'all'
    || listFilters.selectedEmpIds.length > 1,
  );

  const apiEmployeeId = listFilters.selectedEmpIds.length === 1
    ? listFilters.selectedEmpIds[0]
    : undefined;

  const loadReferenceData = React.useCallback(async () => {
    const scope = await resolveOrganizationScope();
    const cid = scope.companyId ?? null;
    setCompanyId(cid);
    companyIdRef.current = cid;

    const [employeesRes, typesRes] = await Promise.all([
      employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
      violationTypesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
    ]);

    const employeeItems = ensurePaginatedResult(employeesRes).items;
    const typeItems = ensurePaginatedResult(typesRes).items;
    const employeeMap = new Map(employeeItems.map((e) => [e.id, e.nameAr]));
    const typeMap = new Map(typeItems.map((t) => [t.id, t.nameAr]));
    employeeMapRef.current = employeeMap;
    typeMapRef.current = typeMap;

    setEmployees(employeeItems.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    setViolationTypes(
      typeItems.map((t) => ({
        id: t.id,
        nameAr: t.nameAr,
        code: t.code,
        isActive: t.isActive,
        needsWarning: t.needsWarning ?? false,
        needsInvestigation: t.needsInvestigation ?? false,
      })),
    );
  }, []);

  React.useEffect(() => {
    void loadReferenceData().catch(() => undefined);
  }, [loadReferenceData]);

  const buildRecordsQuery = React.useCallback(
    (page: number, limit: number) => ({
      ...(companyIdRef.current ? { companyId: companyIdRef.current } : {}),
      page,
      limit,
      ...(apiEmployeeId ? { employeeId: apiEmployeeId } : {}),
      ...(listFilters.dateFrom ? { violationDateFrom: listFilters.dateFrom } : {}),
      ...(listFilters.dateTo ? { violationDateTo: listFilters.dateTo } : {}),
    }),
    [apiEmployeeId, listFilters.dateFrom, listFilters.dateTo],
  );

  const mapItems = React.useCallback(
    (raw: ViolationRecordResponseDto[]) =>
      raw.map((r) => mapRecord(r, employeeMapRef.current, typeMapRef.current)),
    [],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await violationRecordsApi.getAll(buildRecordsQuery(page, pageSize));
      const items = mapItems(res.items);
      setSourceCases(items);
      const filtered = applyViolationCaseClientFilters(items, listFilters);
      return { items: bulkMode ? filtered : items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-records.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildRecordsQuery, bulkMode, listFilters, mapItems]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await fetchAllPaginatedItems((page, limit) =>
        violationRecordsApi.getAll(buildRecordsQuery(page, limit)),
      );
      const items = mapItems(res.items);
      setSourceCases(items);
      const filtered = applyViolationCaseClientFilters(items, listFilters);
      return { items: filtered, total: filtered.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-records.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildRecordsQuery, listFilters, mapItems]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<ViolationCaseRecord>(loadPage, {
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [
      apiEmployeeId,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.statusFilter,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  const filteredItems = React.useMemo(
    () => applyViolationCaseClientFilters(sourceCases, listFilters),
    [listFilters, sourceCases],
  );

  const createCase = React.useCallback(
    async (payload: {
      employeeId: string;
      violationTypeId: string;
      date: string;
      description: string;
      notes?: string | null;
      attachmentsNote?: string | null;
    }) => {
      const cid = companyId ?? companyIdRef.current;
      if (!cid) throw new Error('تعذر تحديد الشركة');
      const dto: CreateViolationRecordDto = {
        companyId: cid,
        employeeId: payload.employeeId,
        violationTypeId: payload.violationTypeId,
        violationDate: payload.date,
        description: payload.description,
        notes: payload.notes ?? null,
        attachmentsNote: payload.attachmentsNote ?? null,
      };
      await violationRecordsApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const updateCase = React.useCallback(
    async (id: string, patch: UpdateViolationRecordDto) => {
      await violationRecordsApi.update(id, patch);
      await reload();
    },
    [reload],
  );

  const decideCase = React.useCallback(
    async (id: string, payload: DecideViolationRecordDto) => {
      await violationRecordsApi.decide(id, payload);
      await reload();
    },
    [reload],
  );

  const deleteCase = React.useCallback(
    async (id: string) => {
      await violationRecordsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    sourceCases,
    employees,
    violationTypes,
    companyId,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    createCase,
    updateCase,
    decideCase,
    deleteCase,
    reload,
  };
}

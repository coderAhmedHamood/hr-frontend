'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplineNoticesApi,
  type DisciplineNoticeResponseDto,
  type CreateDisciplineNoticeDto,
} from '@/features/hr/discipline/lib/api/discipline-notices';
import type { HRDisciplineNoticeKind } from '@/features/hr/discipline/lib/types';
import { NOTICE_KIND_LABELS } from '@/features/hr/discipline/lib/types';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';

export type NoticeEmployee = { id: string; nameAr: string };
export type NoticeCase = { id: string; caseNumber: string; employeeId: string; employeeNameAr: string };

export type NoticeRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  kind: HRDisciplineNoticeKind;
  kindLabel: string;
  reasonAr: string;
  date: string;
  linkedCaseId: string | null;
  linkedCaseNumber: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoticeListFilters = {
  selectedEmpIds: string[];
  kindFilter: 'all' | HRDisciplineNoticeKind;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: NoticeListFilters = {
  selectedEmpIds: [],
  kindFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

const NOTICE_KIND_MAP: Record<string, HRDisciplineNoticeKind> = {
  verbal: 'verbal',
  first: 'first',
  second: 'second',
  final: 'final',
  'إنذار أول': 'first',
  'إنذار ثانٍ': 'second',
  'إنذار ثاني': 'second',
  'إنذار نهائي': 'final',
  شفهي: 'verbal',
};

function normalizeNoticeKind(raw: string): HRDisciplineNoticeKind {
  const trimmed = raw.trim();
  const mapped = NOTICE_KIND_MAP[trimmed];
  if (mapped) return mapped;
  if (/ثان/i.test(trimmed)) return 'second';
  if (/أول|اول/i.test(trimmed)) return 'first';
  if (/نهائي/i.test(trimmed)) return 'final';
  if (/شفه/i.test(trimmed)) return 'verbal';
  return 'verbal';
}

function mapNotice(
  dto: DisciplineNoticeResponseDto,
  employeesById: Map<string, string>,
): NoticeRecord {
  const kind = normalizeNoticeKind(dto.noticeKind);
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeNameAr: employeesById.get(dto.employeeId) ?? dto.employeeId,
    kind,
    kindLabel: dto.noticeKind?.trim() || NOTICE_KIND_LABELS[kind],
    reasonAr: dto.reasonAr,
    date: dto.noticeDate,
    linkedCaseId: dto.violationRecordId,
    linkedCaseNumber: dto.linkedViolationRecordNumber,
    attachmentsNote: dto.attachmentsNote,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

function applyNoticeClientFilters(
  notices: NoticeRecord[],
  filters: NoticeListFilters,
): NoticeRecord[] {
  const selected = new Set(filters.selectedEmpIds);
  return notices.filter((n) => {
    if (selected.size > 0 && !selected.has(n.employeeId)) return false;
    if (!matchesDateRange(n.date, filters.dateFrom, filters.dateTo)) return false;
    if (filters.kindFilter !== 'all' && n.kind !== filters.kindFilter) return false;
    return true;
  });
}

export function useDisciplineNoticesDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<NoticeListFilters>(DEFAULT_LIST_FILTERS);
  const [sourceNotices, setSourceNotices] = React.useState<NoticeRecord[]>([]);
  const [employees, setEmployees] = React.useState<NoticeEmployee[]>([]);
  const [cases, setCases] = React.useState<NoticeCase[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeMapRef = React.useRef<Map<string, string>>(new Map());

  const bulkMode = Boolean(
    listFilters.dateFrom
    || listFilters.dateTo
    || listFilters.kindFilter !== 'all'
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

  const buildNoticesQuery = React.useCallback(
    (page: number, limit: number) => ({
      companyId: companyIdRef.current!,
      page,
      limit,
      ...(apiEmployeeId ? { employeeId: apiEmployeeId } : {}),
    }),
    [apiEmployeeId],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      if (!companyIdRef.current) return { items: [], total: 0 };

      const res = await disciplineNoticesApi.getAll(buildNoticesQuery(page, pageSize));
      const items = res.items.map((n) => mapNotice(n, employeeMapRef.current));
      setSourceNotices(items);
      const filtered = applyNoticeClientFilters(items, listFilters);
      return { items: filtered, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-notices.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildNoticesQuery, listFilters]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      if (!companyIdRef.current) return { items: [], total: 0 };

      const res = await fetchAllPaginatedItems((page, limit) =>
        disciplineNoticesApi.getAll(buildNoticesQuery(page, limit)),
      );
      const items = res.items.map((n) => mapNotice(n, employeeMapRef.current));
      setSourceNotices(items);
      const filtered = applyNoticeClientFilters(items, listFilters);
      return { items: filtered, total: filtered.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-notices.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildNoticesQuery, listFilters]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<NoticeRecord>(loadPage, {
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    enabled: !!companyIdRef.current || true,
    resetDeps: [
      apiEmployeeId,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.kindFilter,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  const filteredItems = React.useMemo(
    () => applyNoticeClientFilters(sourceNotices, listFilters),
    [listFilters, sourceNotices],
  );

  const dateFilteredItems = React.useMemo(
    () => sourceNotices.filter((n) => matchesDateRange(n.date, listFilters.dateFrom, listFilters.dateTo)),
    [listFilters.dateFrom, listFilters.dateTo, sourceNotices],
  );

  const createNotice = React.useCallback(
    async (payload: {
      employeeId: string;
      kind: HRDisciplineNoticeKind;
      reasonAr: string;
      date: string;
      linkedCaseId?: string | null;
      attachmentsNote?: string | null;
    }) => {
      const cid = companyId ?? companyIdRef.current;
      if (!cid) throw new Error('تعذر تحديد الشركة');
      const dto: CreateDisciplineNoticeDto = {
        companyId: cid,
        employeeId: payload.employeeId,
        noticeKind: NOTICE_KIND_LABELS[payload.kind],
        reasonAr: payload.reasonAr,
        noticeDate: payload.date,
        violationRecordId: payload.linkedCaseId ?? null,
        attachmentsNote: payload.attachmentsNote ?? null,
      };
      await disciplineNoticesApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const deleteNotice = React.useCallback(
    async (id: string) => {
      await disciplineNoticesApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    dateFilteredItems,
    sourceNotices,
    employees,
    cases,
    companyId,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    createNotice,
    deleteNotice,
    reload,
  };
}

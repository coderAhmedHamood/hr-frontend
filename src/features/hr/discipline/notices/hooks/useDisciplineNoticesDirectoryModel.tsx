'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
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

export type NoticeEmployee = { id: string; nameAr: string };
export type NoticeCase = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
  violationTypeNameAr: string | null;
};

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

/** Raw notice_kind spelling variants written historically for each canonical kind. */
const KIND_TO_RAW_VARIANTS: Record<HRDisciplineNoticeKind, string[]> = {
  verbal: ['شفهي'],
  first: ['إنذار أول'],
  second: ['إنذار ثانٍ', 'إنذار ثاني'],
  final: ['إنذار نهائي'],
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

export function useDisciplineNoticesDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<NoticeListFilters>(DEFAULT_LIST_FILTERS);
  const [employees, setEmployees] = React.useState<NoticeEmployee[]>([]);
  const [cases, setCases] = React.useState<NoticeCase[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeMapRef = React.useRef<Map<string, string>>(new Map());

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
        violationTypeNameAr: r.violationType?.nameAr?.trim() || null,
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
      ...(listFilters.selectedEmpIds.length > 0 ? { employeeIds: listFilters.selectedEmpIds } : {}),
      ...(listFilters.kindFilter !== 'all' ? { noticeKinds: KIND_TO_RAW_VARIANTS[listFilters.kindFilter] } : {}),
      ...(listFilters.dateFrom ? { dateFrom: listFilters.dateFrom } : {}),
      ...(listFilters.dateTo ? { dateTo: listFilters.dateTo } : {}),
    }),
    [listFilters],
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
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'discipline-notices.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildNoticesQuery]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<NoticeRecord>(loadPage, {
    resetDeps: [
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.kindFilter,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  // Server applies all list filters now; kept as aliases for existing consumers.
  const filteredItems = items;
  const dateFilteredItems = items;

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
    sourceNotices: items,
    employees,
    cases,
    companyId,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    listFilters,
    setListFilters,
    createNotice,
    deleteNotice,
    reload,
  };
}

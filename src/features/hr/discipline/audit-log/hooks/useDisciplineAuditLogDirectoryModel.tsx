'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { auditLogsApi, type AuditLogResponseDto } from '@/features/hr/discipline/lib/api/audit-logs';
import type { HRDisciplineAuditCategory, HRDisciplineAuditAction } from '@/features/hr/discipline/lib/discipline-audit-log';
import {
  AUDIT_ACTION_LABELS_AR,
  AUDIT_CATEGORY_LABELS_AR,
} from '@/features/hr/discipline/lib/discipline-audit-log';
import { dateToYMD, matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';

const DISCIPLINE_ENTITY_PREFIX = 'hr_job_discipline_';

const DISCIPLINE_ENTITY_NAMES = new Set([
  'hr_job_discipline_violation_records',
  'hr_job_discipline_notices',
  'hr_job_discipline_circulars',
  'hr_job_discipline_investigations',
  'hr_job_discipline_appeals',
  'hr_job_discipline_payroll_deductions',
  'hr_job_discipline_approval_templates',
]);

function isDisciplineAuditEntity(entityName: string): boolean {
  const name = entityName.trim();
  return name.startsWith(DISCIPLINE_ENTITY_PREFIX) || DISCIPLINE_ENTITY_NAMES.has(name);
}

const ENTITY_TO_CATEGORY: Record<string, HRDisciplineAuditCategory> = {
  hr_job_discipline_violation_records: 'violation_case',
  hr_job_discipline_notices: 'violation_case',
  hr_job_discipline_investigations: 'investigation',
  hr_job_discipline_appeals: 'appeal',
};

function mapAction(action: string): HRDisciplineAuditAction {
  const upper = action.toUpperCase();
  if (upper === 'CREATE') return 'create';
  if (upper === 'UPDATE' || upper === 'PATCH') return 'update';
  if (upper === 'DELETE' || upper === 'REMOVE') return 'delete';
  if (upper === 'SUBMIT') return 'submit';
  if (upper === 'APPROVE') return 'approve';
  if (upper === 'REJECT') return 'reject';
  if (upper === 'REQUEST_EDIT') return 'request_edit';
  if (upper === 'PAYROLL_POSTED') return 'payroll_posted';
  return 'update';
}

function mapCategory(entityName: string): HRDisciplineAuditCategory {
  return ENTITY_TO_CATEGORY[entityName] ?? 'violation_case';
}

export type AuditLogEntry = {
  id: string;
  occurredAt: string;
  actorNameAr: string;
  category: HRDisciplineAuditCategory;
  actionType: HRDisciplineAuditAction;
  recordId: string;
  recordRefAr: string;
  recordStatusAfterAr: string;
  previousSnapshotAr: string;
  currentSnapshotAr: string;
};

export type AuditLogListFilters = {
  q: string;
  catFilter: 'all' | HRDisciplineAuditCategory;
  selectedActorIds: string[];
  statusFilter: 'all' | HRDisciplineAuditAction;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: AuditLogListFilters = {
  q: '',
  catFilter: 'all',
  selectedActorIds: [],
  statusFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

function dtoToEntry(dto: AuditLogResponseDto): AuditLogEntry {
  const prev = dto.oldValues ? JSON.stringify(dto.oldValues, null, 2) : '';
  const next = dto.newValues ? JSON.stringify(dto.newValues, null, 2) : '';
  return {
    id: dto.id,
    occurredAt: typeof dto.occurredAt === 'string' ? dto.occurredAt : new Date(dto.occurredAt).toISOString(),
    actorNameAr: dto.actorName ?? dto.actorEmail ?? 'غير محدد',
    category: mapCategory(dto.entityName),
    actionType: mapAction(dto.action),
    recordId: dto.entityId ?? dto.id,
    recordRefAr: dto.entityDisplayName ?? dto.entityId ?? '—',
    recordStatusAfterAr: dto.description ?? dto.actionNameAr ?? dto.action,
    previousSnapshotAr: prev,
    currentSnapshotAr: next,
  };
}

function occurredAtToYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateToYMD(d);
}

function applyAuditLogFilters(
  entries: AuditLogEntry[],
  filters: AuditLogListFilters,
  actionLabels: Record<HRDisciplineAuditAction, string>,
  categoryLabels: Record<HRDisciplineAuditCategory, string>,
): AuditLogEntry[] {
  const q = filters.q.trim().toLowerCase();
  const selectedActors = new Set(filters.selectedActorIds);

  const searchAndActorFiltered = entries.filter((e) => {
    if (filters.catFilter !== 'all' && e.category !== filters.catFilter) return false;
    if (selectedActors.size > 0 && !selectedActors.has(e.actorNameAr.trim())) return false;
    if (!q) return true;
    const hay = [
      e.recordRefAr, e.actorNameAr, e.recordStatusAfterAr,
      e.previousSnapshotAr, e.currentSnapshotAr, e.recordId,
      categoryLabels[e.category], actionLabels[e.actionType],
    ].join('\n').toLowerCase();
    return hay.includes(q);
  });

  const dateFiltered = searchAndActorFiltered.filter((e) =>
    matchesDateRange(occurredAtToYmd(e.occurredAt), filters.dateFrom, filters.dateTo),
  );

  return filters.statusFilter === 'all'
    ? dateFiltered
    : dateFiltered.filter((e) => e.actionType === filters.statusFilter);
}

export function useDisciplineAuditLogDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<AuditLogListFilters>(DEFAULT_LIST_FILTERS);
  const [allEntries, setAllEntries] = React.useState<AuditLogEntry[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);

  const allEntriesRef = React.useRef<AuditLogEntry[]>([]);
  const cacheInvalidRef = React.useRef(true);
  const fetchPromiseRef = React.useRef<Promise<void> | null>(null);

  const fetchAllEntries = React.useCallback(async () => {
    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    fetchPromiseRef.current = (async () => {
      setListError(null);
      try {
        const scope = await resolveOrganizationScope();
        const cid = scope.companyId ?? undefined;
        if (!cid) {
          allEntriesRef.current = [];
          setAllEntries([]);
          cacheInvalidRef.current = false;
          return;
        }

        const res = await fetchAllPaginatedItems((page, limit) =>
          auditLogsApi.getAll({ companyId: cid, page, limit }),
        );
        const all = res.items
          .filter((dto) => isDisciplineAuditEntity(dto.entityName))
          .map(dtoToEntry);
        all.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
        allEntriesRef.current = all;
        setAllEntries(all);
        cacheInvalidRef.current = false;
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'audit-logs.load');
        setListError(displayMessage);
        allEntriesRef.current = [];
        setAllEntries([]);
      } finally {
        fetchPromiseRef.current = null;
      }
    })();

    await fetchPromiseRef.current;
  }, []);

  const loadBulk = React.useCallback(async () => {
    if (cacheInvalidRef.current) {
      await fetchAllEntries();
    }
    const filtered = applyAuditLogFilters(
      allEntriesRef.current,
      listFilters,
      AUDIT_ACTION_LABELS_AR,
      AUDIT_CATEGORY_LABELS_AR,
    );
    return { items: filtered, total: filtered.length };
  }, [fetchAllEntries, listFilters]);

  const {
    items,
    loading,
    pagination,
    reload: reloadPaged,
  } = useServerDirectoryPagination<AuditLogEntry>(
    async () => ({ items: [], total: 0 }),
    {
      bulkMode: true,
      loadBulk,
      resetDeps: [
        listFilters.q,
        listFilters.catFilter,
        listFilters.selectedActorIds.join(','),
        listFilters.statusFilter,
        listFilters.dateFrom,
        listFilters.dateTo,
      ],
    },
  );

  const reload = React.useCallback(async () => {
    cacheInvalidRef.current = true;
    await reloadPaged();
  }, [reloadPaged]);

  const actorPickerList = React.useMemo(() => {
    const names = new Set<string>();
    for (const e of allEntries) {
      if (e.actorNameAr?.trim()) names.add(e.actorNameAr.trim());
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({ id: name, name }));
  }, [allEntries]);

  const searchFilteredItems = React.useMemo(() => {
    const q = listFilters.q.trim().toLowerCase();
    const selectedActors = new Set(listFilters.selectedActorIds);
    return allEntries.filter((e) => {
      if (listFilters.catFilter !== 'all' && e.category !== listFilters.catFilter) return false;
      if (selectedActors.size > 0 && !selectedActors.has(e.actorNameAr.trim())) return false;
      if (!q) return true;
      const hay = [
        e.recordRefAr, e.actorNameAr, e.recordStatusAfterAr,
        e.previousSnapshotAr, e.currentSnapshotAr, e.recordId,
        AUDIT_CATEGORY_LABELS_AR[e.category], AUDIT_ACTION_LABELS_AR[e.actionType],
      ].join('\n').toLowerCase();
      return hay.includes(q);
    });
  }, [allEntries, listFilters]);

  const dateFilteredItems = React.useMemo(
    () => searchFilteredItems.filter((e) =>
      matchesDateRange(occurredAtToYmd(e.occurredAt), listFilters.dateFrom, listFilters.dateTo),
    ),
    [listFilters.dateFrom, listFilters.dateTo, searchFilteredItems],
  );

  const filteredItems = React.useMemo(
    () => applyAuditLogFilters(
      allEntries,
      listFilters,
      AUDIT_ACTION_LABELS_AR,
      AUDIT_CATEGORY_LABELS_AR,
    ),
    [allEntries, listFilters],
  );

  return {
    items,
    filteredItems,
    dateFilteredItems,
    searchFilteredItems,
    allEntries,
    actorPickerList,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    reload,
  };
}

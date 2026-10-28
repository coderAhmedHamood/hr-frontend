'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  attendanceEventsApi,
  type AttendanceEventResponseDto,
  type AttendanceEventType,
  type AttendanceEventListQuery,
} from '@/features/hr/attendance/lib/api/attendance-events';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { mapCheckInPointResponse } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ListFilterBar, type ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { Button } from '@/components/ui/button';
import { ListSortMenu, listSortQuery, useListSort, type ListSortOption } from '@/components/ui/list-sort';
import { useOrgFilter } from '@/features/hr/lib/use-org-filter';
import { isPeriodFilterActive, normalizePeriodRange, todayYMD } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  attendanceFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { RegisterExportMenu } from '@/components/pdf/register-export-menu';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useLatestCallback } from '@/shared/hooks/use-latest-callback';
import {
  CREATE_PICKER_ACTIVE_ONLY,
  employeeStatusFilterLabelAr,
  employeeStatusQuery,
  isEmployeeStatusFilterActive,
  useEmployeeStatusFilter,
} from '@/features/hr/lib/employee-status-filter';
import { filterEmployeesByStatus } from '@/features/hr/lib/use-employee-filter-picker';
import {
  ATTENDANCE_EVENT_SOURCE_LABELS,
  ATTENDANCE_EVENT_TYPE_LABELS,
  ATTENDANCE_EVENTS_EXPORT_COLUMNS,
  attendanceEventsExportRows,
} from '@/features/hr/attendance/events/utils/attendance-events-export';

/** Fields the events list can be sorted by (server `sortBy` keys). */
export const ATTENDANCE_EVENTS_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'occurredAt', label: 'الوقت' },
  { key: 'workDate', label: 'اليوم' },
  { key: 'employeeName', label: 'الموظف' },
  { key: 'employeeCode', label: 'رقم الموظف' },
  { key: 'eventType', label: 'نوع الحدث' },
  { key: 'source', label: 'المصدر' },
  { key: 'checkInPoint', label: 'نقطة التسجيل' },
];

/** Sorting by day or time keeps the list grouped by day. */
export function eventsSortKeepsDayGroups(sortKey: string | undefined): boolean {
  return !sortKey || sortKey === 'occurredAt' || sortKey === 'workDate';
}

export type EventsFilterState = {
  from: string;
  to: string;
  employeeId: string;
  eventType: string;
  includeVoided: boolean;
};

export function useAttendanceEventsModel() {
  useSetPageTitle({
    titleAr: 'الأحداث',
    descriptionAr: 'سجلات الحضور والانصراف والاستراحات لجميع الموظفين.',
    iconName: 'Activity',
  });

  const companyId = useDefaultCompanyId() ?? '';

  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);

  const [dateBounds, setDateBounds] = usePersistedFilterState(
    attendanceFiltersKey('events', companyId, 'dateBounds'),
    { from: todayYMD(), to: todayYMD() },
  );
  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    attendanceFiltersKey('events', companyId, 'selectedEmpIds'),
  );
  const [eventTypeFilter, setEventTypeFilter] = usePersistedFilterState(
    attendanceFiltersKey('events', companyId, 'eventTypeFilter'),
    'all',
  );
  const [includeVoided, setIncludeVoided] = usePersistedFilterState(
    attendanceFiltersKey('events', companyId, 'includeVoided'),
    false,
  );
  const [employeeStatus, setEmployeeStatus] = useEmployeeStatusFilter(
    attendanceFiltersKey('events', companyId, 'employeeStatus'),
  );
  const [sourceFilter, setSourceFilter] = usePersistedFilterState(
    attendanceFiltersKey('events', companyId, 'sourceFilter'),
    'all',
  );
  const [checkpointFilter, setCheckpointFilter] = usePersistedFilterState(
    attendanceFiltersKey('events', companyId, 'checkpointFilter'),
    'all',
  );
  const org = useOrgFilter('attendance', 'events', companyId);
  const sort = useListSort(
    companyId ? `hr-sort:attendance:events:${companyId}` : null,
    ATTENDANCE_EVENTS_SORT_OPTIONS,
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [voidTarget, setVoidTarget] = React.useState<AttendanceEventResponseDto | null>(null);
  const [detailTarget, setDetailTarget] = React.useState<AttendanceEventResponseDto | null>(null);

  React.useEffect(() => {
    if (!companyId) return;
    void Promise.allSettled([
      employeesApi.getAll({ companyId, limit: 500 }),
      checkInPointsApi.getAll({ limit: 200, companyId, ...organizationActiveListStatusQuery() }),
    ]).then(([empRes, cpRes]) => {
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.items);
      if (cpRes.status === 'fulfilled') setCheckpoints(cpRes.value.items.map(mapCheckInPointResponse));
    });
  }, [companyId]);

  const from = dateBounds.from || todayYMD();
  const to = dateBounds.to || todayYMD();
  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const buildListQuery = React.useCallback((page: number, pageSize: number): AttendanceEventListQuery => {
    const query: AttendanceEventListQuery = {
      page,
      limit: pageSize,
      workDateFrom: from,
      workDateTo: to,
      includeVoided: includeVoided || undefined,
      ...employeeStatusQuery(employeeStatus),
    };
    if (companyId) query.companyId = companyId;
    if (selectedEmpIds.size > 0) query.employeeIds = [...selectedEmpIds];
    if (eventTypeFilter !== 'all') query.eventType = eventTypeFilter as AttendanceEventType;
    if (sourceFilter !== 'all') query.source = sourceFilter as AttendanceEventListQuery['source'];
    if (checkpointFilter !== 'all') query.checkInPointId = checkpointFilter;
    Object.assign(query, org.query, listSortQuery(sort.sort));
    return query;
  }, [
    companyId, from, to, includeVoided, selectedEmpIds, eventTypeFilter, employeeStatus,
    sourceFilter, checkpointFilter, org.query, sort.sort,
  ]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as AttendanceEventResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await attendanceEventsApi.getAll(buildListQuery(page, pageSize));
      setApiAccessDenied(false);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'attendance-events.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId]);

  const {
    items: events,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<AttendanceEventResponseDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [
      companyId, from, to, selectedEmpKey, eventTypeFilter, includeVoided, employeeStatus,
      sourceFilter, checkpointFilter, org.resetKey, sort.sortKey,
    ],
  });

  const handleVoid = React.useCallback(async (id: string, reason: string) => {
    try {
      await attendanceEventsApi.void(id, reason);
      toast.success('تم إلغاء الحدث');
      setVoidTarget(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.void');
      toast.error(displayMessage);
    }
  }, [reload]);

  const handleCreate = React.useCallback(async (payload: Parameters<typeof attendanceEventsApi.create>[0]) => {
    try {
      await attendanceEventsApi.create(payload);
      toast.success('تم تسجيل الحدث');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.create');
      toast.error(displayMessage);
      throw err;
    }
  }, [reload]);

  const defaultPeriod = React.useMemo(() => {
    const today = todayYMD();
    return { from: today, to: today };
  }, []);

  const onPeriodChange = React.useCallback((range: { from: string; to: string }) => {
    const normalized = normalizePeriodRange(range);
    if (!normalized) return;
    setDateBounds(normalized);
  }, []);

  const onPeriodFilterClear = React.useCallback(() => {
    const today = todayYMD();
    setDateBounds({ from: today, to: today });
  }, []);

  const periodFilterActive = isPeriodFilterActive(dateBounds, defaultPeriod);

  const activeFilterCount =
    (selectedEmpIds.size > 0 ? 1 : 0)
    + (eventTypeFilter !== 'all' ? 1 : 0)
    + (includeVoided ? 1 : 0)
    + (isEmployeeStatusFilterActive(employeeStatus) ? 1 : 0)
    + (periodFilterActive ? 1 : 0)
    + (sourceFilter !== 'all' ? 1 : 0)
    + (checkpointFilter !== 'all' ? 1 : 0)
    + org.activeCount;

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    {
      id: 'eventType',
      value: eventTypeFilter,
      onChange: setEventTypeFilter,
      placeholder: 'نوع الحدث',
      className: 'w-[9rem]',
      options: [
        { value: 'all', label: 'كل الأنواع' },
        { value: 'check_in', label: 'دخول' },
        { value: 'check_out', label: 'خروج' },
        { value: 'break_start', label: 'بداية استراحة' },
        { value: 'break_end', label: 'نهاية استراحة' },
      ],
    },
    {
      id: 'includeVoided',
      value: includeVoided ? 'true' : 'false',
      onChange: (v) => setIncludeVoided(v === 'true'),
      placeholder: 'الملغاة',
      className: 'w-[9.5rem]',
      options: [
        { value: 'false', label: 'نشطة فقط' },
        { value: 'true', label: 'تضمين الملغاة' },
      ],
    },
    {
      id: 'source',
      value: sourceFilter,
      onChange: setSourceFilter,
      placeholder: 'المصدر',
      className: 'w-[9rem]',
      options: [
        { value: 'all', label: 'كل المصادر' },
        ...Object.entries(ATTENDANCE_EVENT_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
      ],
    },
    ...(checkpoints.length > 0 ? [{
      id: 'checkpoint',
      value: checkpointFilter,
      onChange: setCheckpointFilter,
      placeholder: 'نقطة التسجيل',
      className: 'w-[10rem]',
      options: [
        { value: 'all', label: 'كل النقاط' },
        ...checkpoints.map((cp) => ({ value: cp.id, label: cp.nameAr })),
      ],
    }] : []),
    ...org.inlineSelects,
  ], [eventTypeFilter, includeVoided, sourceFilter, checkpointFilter, checkpoints, org.inlineSelects]);

  // Every active filter and the order, printed under the register's title.
  const exportSubtitleLines = React.useMemo(() => {
    const lines = [
      `الفترة: ${from} — ${to}`,
      `حالة الموظفين: ${employeeStatusFilterLabelAr(employeeStatus)}`,
    ];
    if (selectedEmpIds.size > 0) {
      const names = employees.filter((e) => selectedEmpIds.has(e.id)).map((e) => e.nameAr);
      lines.push(names.length > 0 && names.length <= 5
        ? `الموظفون: ${names.join('، ')}`
        : `الموظفون: ${selectedEmpIds.size} موظف محدد`);
    }
    lines.push(...org.summaryLines);
    if (eventTypeFilter !== 'all') {
      lines.push(`نوع الحدث: ${ATTENDANCE_EVENT_TYPE_LABELS[eventTypeFilter as AttendanceEventType] ?? eventTypeFilter}`);
    }
    if (sourceFilter !== 'all') lines.push(`المصدر: ${ATTENDANCE_EVENT_SOURCE_LABELS[sourceFilter] ?? sourceFilter}`);
    if (checkpointFilter !== 'all') {
      lines.push(`نقطة التسجيل: ${checkpoints.find((cp) => cp.id === checkpointFilter)?.nameAr ?? '—'}`);
    }
    if (includeVoided) lines.push('يشمل الأحداث الملغاة');
    if (sort.label) lines.push(sort.label);
    return lines;
  }, [
    from, to, employeeStatus, selectedEmpIds, employees, org.summaryLines, eventTypeFilter,
    sourceFilter, checkpointFilter, checkpoints, includeVoided, sort.label,
  ]);

  const getExportRows = useLatestCallback(async () => {
    if (!companyId) return [];
    const { items } = await fetchAllPaginatedItems((page, pageSize) =>
      attendanceEventsApi.getAll(buildListQuery(page, pageSize)),
    );
    return attendanceEventsExportRows(items);
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <ListSortMenu model={sort} />
        <RegisterExportMenu
          title="سجل أحداث الحضور"
          fileName={`attendance-events-${from}-${to}`}
          columns={ATTENDANCE_EVENTS_EXPORT_COLUMNS}
          getRows={getExportRows}
          subtitleLines={exportSubtitleLines}
          landscape
        />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> تسجيل حدث
        </Button>
      </div>
    ),
    [activeFilterCount, exportSubtitleLines, from, getExportRows, setCreateOpen, to, sort.sortKey],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        periodValue={{ from, to }}
        onPeriodChange={onPeriodChange}
        defaultPeriod={defaultPeriod}
        onPeriodFilterClear={onPeriodFilterClear}
        companyId={companyId}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        employeeStatus={employeeStatus}
        onEmployeeStatusChange={setEmployeeStatus}
        inlineSelects={inlineSelects}
      />
    ),
    [
      selectedEmpKey,
      employeeStatus,
      eventTypeFilter,
      includeVoided,
      from,
      to,
      periodFilterActive,
      onPeriodFilterClear,
      companyId,
      inlineSelects,
      onPeriodChange,
    ],
  );

  // New events are recorded for active employees only.
  const createEmployees = React.useMemo(
    () => filterEmployeesByStatus(employees, CREATE_PICKER_ACTIVE_ONLY),
    [employees],
  );

  return {
    events,
    employees: createEmployees,
    checkpoints,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    from,
    to,
    companyId,
    createOpen,
    setCreateOpen,
    voidTarget,
    setVoidTarget,
    detailTarget,
    setDetailTarget,
    includeVoided,
    setIncludeVoided,
    sort,
    handleVoid,
    handleCreate,
    reload,
  };
}

export type AttendanceEventsModel = ReturnType<typeof useAttendanceEventsModel>;

'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
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
import { isPeriodFilterActive, normalizePeriodRange, todayYMD } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  attendanceFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';

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
  const bulkMode = selectedEmpIds.size > 1;

  const buildListQuery = React.useCallback((page: number, pageSize: number): AttendanceEventListQuery => {
    const query: AttendanceEventListQuery = {
      page,
      limit: pageSize,
      workDateFrom: from,
      workDateTo: to,
      includeVoided: includeVoided || undefined,
    };
    if (companyId) query.companyId = companyId;
    if (selectedEmpIds.size === 1) query.employeeId = [...selectedEmpIds][0];
    if (eventTypeFilter !== 'all') query.eventType = eventTypeFilter as AttendanceEventType;
    return query;
  }, [companyId, from, to, includeVoided, selectedEmpIds, eventTypeFilter]);

  const applyEmployeeFilter = React.useCallback(
    (items: AttendanceEventResponseDto[]) => {
      if (selectedEmpIds.size <= 1) return items;
      return items.filter((e) => selectedEmpIds.has(e.employeeId));
    },
    [selectedEmpIds],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as AttendanceEventResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await attendanceEventsApi.getAll(buildListQuery(page, pageSize));
      const items = applyEmployeeFilter(res.items);
      return { items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [applyEmployeeFilter, buildListQuery, companyId]);

  const loadBulk = React.useCallback(async () => {
    if (!companyId) return { items: [] as AttendanceEventResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await fetchAllPaginatedItems((page, limit) =>
        attendanceEventsApi.getAll(buildListQuery(page, limit)),
      );
      const items = applyEmployeeFilter(res.items);
      return { items, total: items.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [applyEmployeeFilter, buildListQuery, companyId]);

  const {
    items: events,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<AttendanceEventResponseDto>(loadPage, {
    enabled: !!companyId,
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [companyId, from, to, selectedEmpKey, eventTypeFilter, includeVoided],
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
    + (periodFilterActive ? 1 : 0);

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
  ], [eventTypeFilter, includeVoided]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> تسجيل حدث
        </Button>
      </div>
    ),
    [activeFilterCount, setCreateOpen],
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
        inlineSelects={inlineSelects}
      />
    ),
    [
      selectedEmpKey,
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

  return {
    events,
    employees,
    checkpoints,
    loading,
    pagination,
    listError,
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
    handleVoid,
    handleCreate,
    reload,
  };
}

export type AttendanceEventsModel = ReturnType<typeof useAttendanceEventsModel>;

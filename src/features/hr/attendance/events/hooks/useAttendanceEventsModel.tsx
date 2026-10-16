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
  ATTENDANCE_EVENTS_EXPORT_COLUMNS,
  attendanceEventsExportRows,
} from '@/features/hr/attendance/events/utils/attendance-events-export';

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
    return query;
  }, [companyId, from, to, includeVoided, selectedEmpIds, eventTypeFilter, employeeStatus]);

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
    resetDeps: [companyId, from, to, selectedEmpKey, eventTypeFilter, includeVoided, employeeStatus],
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
        <RegisterExportMenu
          title="سجل أحداث الحضور"
          fileName={`attendance-events-${from}-${to}`}
          columns={ATTENDANCE_EVENTS_EXPORT_COLUMNS}
          getRows={getExportRows}
          subtitleLines={[
            `الفترة: ${from} — ${to}`,
            `حالة الموظفين: ${employeeStatusFilterLabelAr(employeeStatus)}`,
          ]}
          landscape
        />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> تسجيل حدث
        </Button>
      </div>
    ),
    [activeFilterCount, employeeStatus, from, getExportRows, setCreateOpen, to],
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
    handleVoid,
    handleCreate,
    reload,
  };
}

export type AttendanceEventsModel = ReturnType<typeof useAttendanceEventsModel>;

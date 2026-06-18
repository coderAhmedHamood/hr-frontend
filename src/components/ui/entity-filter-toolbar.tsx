'use client';

import * as React from 'react';
import {
  CalendarDays, LayoutGrid, List, X, SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';
import {
  filterTabTriggerClass,
  STATUS_COUNT_BADGE,
  STATUS_FILTER_TAB_TONES,
} from '@/shared/status-pill-classes';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  effectiveDateRange,
  dateFilterHasRestriction,
  hasDateRangeFilter,
  ymdToMDYDisplay,
} from '@/features/hr/discipline/lib/discipline-date-filter';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export const DATE_TAB_BASE =
  'discipline-tab-trigger shrink-0 gap-1 px-3 text-[11px] transition-all duration-150 border';

export const DATE_TAB_TRIGGER_CLASS: Record<DateFilterTab, string> = {
  all: filterTabTriggerClass('muted'),
  today: filterTabTriggerClass('primary'),
  week: filterTabTriggerClass('accent'),
  month: filterTabTriggerClass('success'),
  custom: filterTabTriggerClass('gold'),
};

export { STATUS_COUNT_BADGE };

export const STATUS_ALL_TRIGGER_CLASS = filterTabTriggerClass('muted');

export const STATUS_CYCLE_TRIGGER_CLASSES = STATUS_FILTER_TAB_TONES.map((tone) =>
  filterTabTriggerClass(tone),
);

export type EntityFilterToolbarHandle = {
  resetDateFilter: () => void;
  resetStatusFilter: () => void;
};

export type EntityDataViewIcon = 'list' | 'layout-grid' | 'calendar-days';

export type EntityDataViewOption = {
  value: string;
  label: string;
  icon?: EntityDataViewIcon;
};

export type EntityDataViewConfig = {
  value: string;
  onChange: (value: string) => void;
  options: readonly EntityDataViewOption[];
};

/** قائمة منسدلة واحدة بجانب شريط الأدوات (فرع، قسم، …) */
export type EntityFilterInlineSelect = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  className?: string;
};

const EMPTY_EMP_PICKER_LIST: { id: string; name: string }[] = [];
const EMPTY_SELECTED_EMP_IDS = new Set<string>();
const EMPTY_STATUS_ORDER_LIST: readonly string[] = [];
const EMPTY_STATUS_LABELS: Record<string, string> = {};
const DEFAULT_STATUS_COUNTS: Record<string, number> = { all: 0 };
const noopBounds = () => {};
const noopSetEmp = () => {};
const noopStatus = () => {};

const DATA_VIEW_TAB_CLASS =
  'entity-toolbar-view-tab h-7 gap-1 px-2.5 text-[11px] transition-all duration-150 data-[state=active]:!font-semibold data-[state=active]:!shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:border-primary/35';

function DataViewIcon({ name }: { name?: EntityDataViewIcon }) {
  switch (name) {
    case 'layout-grid':
      return <LayoutGrid className="h-3 w-3 shrink-0" />;
    case 'calendar-days':
      return <CalendarDays className="h-3 w-3 shrink-0" />;
    case 'list':
    default:
      return <List className="h-3 w-3 shrink-0" />;
  }
}

export interface EntityFilterToolbarProps {
  empPickerEmployees?: { id: string; name: string }[];
  selectedEmpIds?: Set<string>;
  onSelectedEmpIdsChange?: (s: Set<string>) => void;

  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOrder?: readonly string[];
  statusLabels?: Record<string, string>;
  statusCounts?: Record<string, number>;

  onDateBoundsChange?: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  showDateSection?: boolean;
  showStatusSection?: boolean;
  showEmployeePicker?: boolean;
  /** Initial tab when the date section mounts (default `'all'`). */
  defaultDateFilterTab?: DateFilterTab;

  trailingActions?: React.ReactNode;
  /** Filters rendered first (rightmost in RTL), e.g. a custom date-range trigger */
  leadingFilters?: React.ReactNode;
  beforeEmployeePicker?: React.ReactNode;

  /** Primary inline selects always visible in the toolbar */
  inlineSelects?: readonly EntityFilterInlineSelect[];

  /** Secondary filters shown in a "More filters" popover */
  moreFilters?: readonly EntityFilterInlineSelect[];

  /**
   * `tabs` — قوائم منسدلة للفترات والحالات (الافتراضي).
   * `collapsible` — نفس عرض القوائم المنسدلة (متوافق مع الاسم السابق).
   */
  filterLayout?: 'tabs' | 'collapsible';

  /** تبديل عرض البيانات (جدول / شبكة / بطاقات / تقويم …) قبل `trailingActions` */
  dataView?: EntityDataViewConfig;
}

// ─── Shared clearable select used by every filter dropdown in the toolbar ─────

function SelectWithClear({
  value,
  onValueChange,
  onClear,
  placeholder,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = value !== '' && value !== undefined;
  return (
    <div className="relative shrink-0">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          dir="rtl"
          hideChevron={isActive}
          className={cn(
            'h-8 text-xs overflow-hidden [&_span]:truncate',
            'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus:border-input',
            'data-[state=open]:ring-0 data-[state=open]:border-input',
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {children}
        </SelectContent>
      </Select>
      {isActive && (
        <button
          type="button"
          aria-label="مسح"
          className="absolute end-2 top-1/2 -translate-y-1/2 z-10 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onClear(); }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export const EntityFilterToolbar = React.forwardRef<
  EntityFilterToolbarHandle,
  EntityFilterToolbarProps
>(function EntityFilterToolbar(
  {
    empPickerEmployees = EMPTY_EMP_PICKER_LIST,
    selectedEmpIds = EMPTY_SELECTED_EMP_IDS,
    onSelectedEmpIdsChange = noopSetEmp,
    statusFilter = 'all',
    onStatusFilterChange = noopStatus,
    statusOrder = EMPTY_STATUS_ORDER_LIST,
    statusLabels = EMPTY_STATUS_LABELS,
    statusCounts = DEFAULT_STATUS_COUNTS,
    onDateBoundsChange = noopBounds,
    onDateFilterMetaChange,
    showDateSection = true,
    showStatusSection = true,
    showEmployeePicker = true,
    defaultDateFilterTab = 'all',
    trailingActions,
    leadingFilters,
    beforeEmployeePicker,
    inlineSelects,
    moreFilters,
    filterLayout = 'tabs',
    dataView,
  },
  ref,
) {
  const [dateFilterTab, setDateFilterTab] = React.useState<DateFilterTab>(defaultDateFilterTab);
  const [appliedCustomFrom, setAppliedCustomFrom] = React.useState('');
  const [appliedCustomTo, setAppliedCustomTo] = React.useState('');
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);

  const effectiveBounds = React.useMemo(
    () => (showDateSection ? effectiveDateRange(dateFilterTab, appliedCustomFrom, appliedCustomTo) : { from: '', to: '' }),
    [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo],
  );

  const onDateBoundsChangeRef = React.useRef(onDateBoundsChange);
  onDateBoundsChangeRef.current = onDateBoundsChange;
  const lastEmittedBoundsKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const b = effectiveBounds;
    const key = `${b.from}\u0000${b.to}`;
    if (lastEmittedBoundsKeyRef.current === key) return;
    lastEmittedBoundsKeyRef.current = key;
    onDateBoundsChangeRef.current(b);
  }, [effectiveBounds]);

  const onDateFilterMetaChangeRef = React.useRef(onDateFilterMetaChange);
  onDateFilterMetaChangeRef.current = onDateFilterMetaChange;
  const lastEmittedMetaKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!showDateSection) {
      const key = 'all|0';
      if (lastEmittedMetaKeyRef.current === key) return;
      lastEmittedMetaKeyRef.current = key;
      onDateFilterMetaChangeRef.current?.({ tab: 'all', hasRestriction: false });
      return;
    }
    const hasR = dateFilterHasRestriction(dateFilterTab, appliedCustomFrom, appliedCustomTo);
    const key = `${dateFilterTab}|${hasR ? 1 : 0}`;
    if (lastEmittedMetaKeyRef.current === key) return;
    lastEmittedMetaKeyRef.current = key;
    onDateFilterMetaChangeRef.current?.({
      tab: dateFilterTab,
      hasRestriction: hasR,
    });
  }, [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo]);

  const openCustomDateDialog = React.useCallback(() => {
    setCustomDialogOpen(true);
  }, []);

  const resetDateFilter = React.useCallback(() => {
    setDateFilterTab('all');
    setAppliedCustomFrom('');
    setAppliedCustomTo('');
  }, []);

  const resetStatusFilter = React.useCallback(() => {
    onStatusFilterChange('all');
  }, [onStatusFilterChange]);

  const prevDateTabRef = React.useRef<DateFilterTab>('all');

  const handleDatePeriodSelect = React.useCallback((v: string) => {
    const next = v as DateFilterTab;
    if (next === 'custom') {
      prevDateTabRef.current = dateFilterTab;
      setDateFilterTab('custom');
      openCustomDateDialog();
      return;
    }
    setDateFilterTab(next);
  }, [dateFilterTab, openCustomDateDialog]);

  React.useImperativeHandle(ref, () => ({
    resetDateFilter,
    resetStatusFilter,
  }), [resetDateFilter, resetStatusFilter]);

  const showDateReset = showDateSection && dateFilterTab !== 'all';
  const showStatusReset = showStatusSection && statusFilter !== 'all';

  const dateTabForSelect: DateFilterTab =
    dateFilterTab === 'all' || dateFilterTab === 'today' || dateFilterTab === 'week' || dateFilterTab === 'month' || dateFilterTab === 'custom'
      ? dateFilterTab
      : 'all';

  const statusSelectValue =
    statusFilter === 'all' || statusOrder.includes(statusFilter) ? statusFilter : 'all';

  const useFilterDropdowns = filterLayout === 'tabs' || filterLayout === 'collapsible';

  const dateCustomRangeRow = showDateSection && dateFilterTab === 'custom' ? (
    <div className="flex w-full min-w-0 max-w-full basis-full shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border/40 bg-muted/15 px-2 py-1.5">
      <p className="min-w-0 text-[11px] text-muted-foreground" dir="ltr">
        {hasDateRangeFilter(appliedCustomFrom, appliedCustomTo)
          ? (
            <>
              <span className="text-foreground/80">المحدد:</span>
              {' '}
              {ymdToMDYDisplay(appliedCustomFrom) || '…'}
              {' — '}
              {ymdToMDYDisplay(appliedCustomTo) || '…'}
            </>
            )
          : 'لم يُحدَّد نطاق. استخدم «اختيار التواريخ» ثم تأكيد.'}
      </p>
      <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 text-[11px]" onClick={() => setCustomDialogOpen(true)}>
        {hasDateRangeFilter(appliedCustomFrom, appliedCustomTo) ? 'تعديل النطاق' : 'اختيار التواريخ'}
      </Button>
    </div>
  ) : null;

  const filterDropdownRow = useFilterDropdowns && (showDateSection || showStatusSection) ? (
    <>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showDateSection ? (
          <SelectWithClear
            value={dateTabForSelect === 'all' ? '' : dateTabForSelect}
            onValueChange={(v) => handleDatePeriodSelect(v || 'all')}
            onClear={resetDateFilter}
            placeholder="اختر الفترة"
            className="w-[9.25rem] max-w-[9.25rem]"
          >
            <SelectItem value="today">اليوم</SelectItem>
            <SelectItem value="week">هذا الأسبوع</SelectItem>
            <SelectItem value="month">هذا الشهر</SelectItem>
            <SelectItem value="custom">مخصص…</SelectItem>
          </SelectWithClear>
        ) : null}
        {showStatusSection ? (
          <SelectWithClear
            value={statusSelectValue === 'all' ? '' : statusSelectValue}
            onValueChange={(v) => onStatusFilterChange(v || 'all')}
            onClear={resetStatusFilter}
            placeholder="اختر الحالة"
            className="w-[9.25rem] max-w-[9.25rem]"
          >
            {statusOrder.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s] ?? s}
              </SelectItem>
            ))}
          </SelectWithClear>
        ) : null}
      </div>
      {dateCustomRangeRow}
    </>
  ) : null;

  const hasSecondaryFilters =
    Boolean(inlineSelects?.length) || Boolean(beforeEmployeePicker) || showEmployeePicker;
  const hasDataView = Boolean(dataView && dataView.options.length >= 2);
  const hasActionStrip = hasDataView || Boolean(trailingActions);

  const pickerBlock = hasSecondaryFilters ? (
    <>
      {inlineSelects?.map((sel) => {
        const allowed = new Set(sel.options.map((o) => o.value));
        const coerced =
          allowed.has(sel.value)
            ? sel.value
            : (sel.options.find((o) => o.value === 'all')?.value ?? sel.options[0]?.value ?? '');
        if (!sel.options.length) return null;
        return (
          <SelectWithClear
            key={sel.id}
            value={coerced === 'all' ? '' : coerced}
            onValueChange={(v) => sel.onChange(v || 'all')}
            onClear={() => sel.onChange('all')}
            placeholder={sel.placeholder ?? '—'}
            className={cn('w-[9rem] max-w-[9rem]', sel.className)}
          >
            {sel.options.filter((o) => o.value !== 'all').map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectWithClear>
        );
      })}
      {beforeEmployeePicker}
      {showEmployeePicker ? (
        <EmployeePicker employees={empPickerEmployees} selected={selectedEmpIds} onChange={onSelectedEmpIdsChange} />
      ) : null}
    </>
  ) : null;


  const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);
  const activeMoreCount = React.useMemo(
    () => moreFilters?.filter((f) => f.value !== 'all' && f.value !== '').length ?? 0,
    [moreFilters],
  );

  const hasAnyActiveFilter = React.useMemo(() =>
    (showDateSection && dateFilterTab !== 'all') ||
    (showStatusSection && statusFilter !== 'all') ||
    (inlineSelects?.some((s) => s.value !== 'all' && s.value !== '') ?? false) ||
    (moreFilters?.some((s) => s.value !== 'all' && s.value !== '') ?? false),
    [showDateSection, dateFilterTab, showStatusSection, statusFilter, inlineSelects, moreFilters],
  );

  const clearAllFilters = React.useCallback(() => {
    resetDateFilter();
    resetStatusFilter();
    inlineSelects?.forEach((s) => s.onChange('all'));
    moreFilters?.forEach((s) => s.onChange('all'));
  }, [resetDateFilter, resetStatusFilter, inlineSelects, moreFilters]);

  const moreFiltersPopover = moreFilters?.length ? (
    <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'relative h-8 gap-1.5 px-3 text-xs shrink-0',
            activeMoreCount > 0 && 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          فلاتر
          {activeMoreCount > 0 && (
            <Badge
              variant="secondary"
              className="ms-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground"
            >
              {activeMoreCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-4"
        dir="rtl"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">فلاتر إضافية</p>
          {activeMoreCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                moreFilters.forEach((f) => {
                  const allOpt = f.options.find((o) => o.value === 'all');
                  if (allOpt) f.onChange('all');
                });
              }}
            >
              <X className="h-3 w-3" />
              إعادة ضبط
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {moreFilters.map((sel) => {
            const allowed = new Set(sel.options.map((o) => o.value));
            const coerced = allowed.has(sel.value)
              ? sel.value
              : (sel.options.find((o) => o.value === 'all')?.value ?? sel.options[0]?.value ?? '');
            if (!sel.options.length) return null;
            const isActive = coerced !== 'all' && coerced !== '';
            return (
              <div key={sel.id} className="space-y-1.5">
                <label className={cn('block text-xs font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {sel.placeholder ?? sel.id}
                </label>
                <SelectWithClear
                  value={coerced === 'all' ? '' : coerced}
                  onValueChange={(v) => sel.onChange(v || 'all')}
                  onClear={() => sel.onChange('all')}
                  placeholder={sel.placeholder ?? '—'}
                  className={cn('w-full', isActive && 'border-primary/40 bg-primary/5')}
                >
                  {sel.options.filter((o) => o.value !== 'all').map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectWithClear>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm overflow-visible sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          {leadingFilters}
          {leadingFilters ? (
            <>
              {pickerBlock}
              {filterDropdownRow}
            </>
          ) : (
            <>
              {filterDropdownRow}
              {pickerBlock}
            </>
          )}
          {moreFiltersPopover}
          {hasDataView && dataView ? (
            <div className="ms-auto">
              <Tabs value={dataView.value} onValueChange={dataView.onChange}>
                <TabsList className="h-8 shrink-0 gap-0.5 bg-muted/70 p-0.5">
                  {dataView.options.map((opt) => (
                    <TabsTrigger key={opt.value} value={opt.value} className={DATA_VIEW_TAB_CLASS}>
                      <DataViewIcon name={opt.icon} />
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          ) : null}
          {trailingActions && (
            <div className="ms-auto flex items-center gap-2">
              {trailingActions}
            </div>
          )}
          {hasAnyActiveFilter && (
            <button
              type="button"
              aria-label="مسح كل الفلاتر"
              className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={clearAllFilters}
            >
              <X className="h-3.5 w-3.5" />
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {showDateSection ? (
        <DateRangePicker
          open={customDialogOpen}
          onOpenChange={(open) => {
            if (!open && !appliedCustomFrom && !appliedCustomTo) setDateFilterTab(prevDateTabRef.current);
            setCustomDialogOpen(open);
          }}
          value={{ from: appliedCustomFrom, to: appliedCustomTo }}
          onApply={({ from, to }) => {
            setAppliedCustomFrom(from);
            setAppliedCustomTo(to);
          }}
        />
      ) : null}
    </>
  );
});

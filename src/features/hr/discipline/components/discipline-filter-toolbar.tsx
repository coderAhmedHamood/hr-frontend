'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ListFilterBar,
  type ListFilterBarHandle,
  type ListFilterInlineSelect,
} from '@/components/ui/list-filter-bar';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';

export {
  DATE_TAB_BASE,
  DATE_TAB_TRIGGER_CLASS,
  STATUS_COUNT_BADGE,
  STATUS_ALL_TRIGGER_CLASS,
  STATUS_CYCLE_TRIGGER_CLASSES,
} from '@/components/ui/list-filter-bar';

export type DisciplineViewMode = 'cards' | 'list';

export type DisciplineFilterToolbarHandle = ListFilterBarHandle;

export interface DisciplineFilterToolbarProps {
  /** افتراضي true؛ عيّنها false لصفحات العرض فقط (مثل سجل العمليات) */
  showPrimaryAction?: boolean;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionIcon?: React.ReactNode;

  /** Loads the standard employee picker when `empPickerEmployees` is omitted. */
  companyId?: string | null;
  /** Override picker options (e.g. audit log actors). */
  empPickerEmployees?: { id: string; name: string }[];
  selectedEmpIds: Set<string>;
  onSelectedEmpIdsChange: (s: Set<string>) => void;

  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOrder?: readonly string[];
  statusLabels?: Record<string, string>;
  statusCounts?: Record<string, number>;

  viewMode: DisciplineViewMode;
  onViewModeChange: (v: DisciplineViewMode) => void;

  onDateBoundsChange: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  /** Optional controls before زر الإضافة (e.g. PDF export) */
  toolbarExtraTrailing?: React.ReactNode;

  /** عناصر قبل منتقي الموظفين (مثل فئة السجل في سجل العمليات) */
  beforeEmployeePicker?: React.ReactNode;

  /** فلاتر ثانوية في نافذة منبثقة "فلاتر" */
  moreFilters?: readonly ListFilterInlineSelect[];
}

export const DisciplineFilterToolbar = React.forwardRef<
  DisciplineFilterToolbarHandle,
  DisciplineFilterToolbarProps
>(function DisciplineFilterToolbar(
  {
    showPrimaryAction = true,
    primaryActionLabel,
    onPrimaryAction,
    primaryActionIcon,
    companyId,
    empPickerEmployees,
    selectedEmpIds,
    onSelectedEmpIdsChange,
    statusFilter = 'all',
    onStatusFilterChange = () => {},
    statusOrder = [],
    statusLabels = {},
    statusCounts = {},
    viewMode,
    onViewModeChange,
    onDateBoundsChange,
    onDateFilterMetaChange,
    toolbarExtraTrailing,
    beforeEmployeePicker,
    moreFilters,
  },
  ref,
) {
  const icon = primaryActionIcon ?? <Plus className="h-3.5 w-3.5 shrink-0" />;

  return (
    <ListFilterBar
      ref={ref}
      companyId={companyId}
      empPickerEmployees={empPickerEmployees}
      selectedEmpIds={selectedEmpIds}
      onSelectedEmpIdsChange={onSelectedEmpIdsChange}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      statusOrder={statusOrder}
      statusLabels={statusLabels}
      statusCounts={statusCounts}
      onDateBoundsChange={onDateBoundsChange}
      onDateFilterMetaChange={onDateFilterMetaChange}
      defaultDateFilterTab="all"
      optionalDateRange
      beforeEmployeePicker={beforeEmployeePicker}
      moreFilters={moreFilters}
      dataView={{
        value: viewMode,
        onChange: (v) => onViewModeChange(v as DisciplineViewMode),
        options: [
          { value: 'cards', label: 'بطاقات', icon: 'layout-grid' },
          { value: 'list', label: 'قائمة', icon: 'list' },
        ],
      }}
      trailingActions={(
        <>
          {toolbarExtraTrailing}
          {showPrimaryAction ? (
            <Button variant="luxe" size="sm" className="h-8 gap-1 px-3 text-xs shadow-sm" onClick={onPrimaryAction}>
              {icon}
              {primaryActionLabel}
            </Button>
          ) : null}
        </>
      )}
    />
  );
});

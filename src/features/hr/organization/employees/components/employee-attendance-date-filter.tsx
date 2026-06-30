'use client';

import * as React from 'react';
import { SelectItem } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SelectWithClear } from '@/components/ui/select-with-clear';
import { cn } from '@/shared/utils';
import {
  DEFAULT_DATE_FILTER_TAB,
  hasDateRangeFilter,
  normalizePeriodRange,
  ymdToMDYDisplay,
  type DateFilterTab,
} from '@/features/hr/discipline/lib/discipline-date-filter';

type Props = {
  tab: DateFilterTab;
  customFrom: string;
  customTo: string;
  onTabChange: (tab: DateFilterTab) => void;
  onCustomApply: (range: { from: string; to: string }) => void;
  onReset: () => void;
  className?: string;
};

export function EmployeeAttendanceDateFilter({
  tab,
  customFrom,
  customTo,
  onTabChange,
  onCustomApply,
  onReset,
  className,
}: Props) {
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const customApplyPendingRef = React.useRef(false);
  const prevTabRef = React.useRef<DateFilterTab>(tab);

  const dateTabForSelect =
    tab === 'today' || tab === 'week' || tab === 'month' || tab === 'custom' ? tab : DEFAULT_DATE_FILTER_TAB;

  const displayLabel = React.useMemo(() => {
    if (tab !== 'custom') return undefined;
    if (!hasDateRangeFilter(customFrom, customTo)) return undefined;
    const from = ymdToMDYDisplay(customFrom) || '…';
    const to = ymdToMDYDisplay(customTo) || '…';
    return `المحدد: ${from} — ${to}`;
  }, [tab, customFrom, customTo]);

  const handleSelect = React.useCallback(
    (v: string) => {
      const next = v as DateFilterTab;
      if (next === 'custom') {
        prevTabRef.current = tab;
        onTabChange('custom');
        setCustomDialogOpen(true);
        return;
      }
      onTabChange(next);
    },
    [onTabChange, tab],
  );

  return (
    <>
      <SelectWithClear
        value={dateTabForSelect}
        displayLabel={displayLabel}
        onValueChange={handleSelect}
        onClear={onReset}
        showClear={tab !== DEFAULT_DATE_FILTER_TAB}
        placeholder="اختر الفترة"
        className={cn(
          displayLabel ? 'w-auto min-w-[11rem] max-w-[20rem]' : 'w-[9.25rem] max-w-[9.25rem]',
          className,
        )}
      >
        <SelectItem value="today">اليوم</SelectItem>
        <SelectItem value="week">هذا الأسبوع</SelectItem>
        <SelectItem value="month">هذا الشهر</SelectItem>
        <SelectItem value="custom">مخصص…</SelectItem>
      </SelectWithClear>
      <DateRangePicker
        open={customDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setCustomDialogOpen(true);
            return;
          }
          if (!customApplyPendingRef.current && !customFrom && !customTo) {
            onTabChange(prevTabRef.current);
          }
          customApplyPendingRef.current = false;
          setCustomDialogOpen(false);
        }}
        value={{ from: customFrom, to: customTo }}
        onApply={(range) => {
          const normalized = normalizePeriodRange(range);
          if (!normalized) return;
          customApplyPendingRef.current = true;
          onCustomApply(normalized);
          setCustomDialogOpen(false);
        }}
      />
    </>
  );
}

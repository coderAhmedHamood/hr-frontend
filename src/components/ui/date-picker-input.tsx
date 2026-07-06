'use client';

import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { AR_MONTHS, Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { cn, formatDisplayDate } from '@/shared/utils';

const DEFAULT_FROM_YEAR = 1950;
const DEFAULT_TO_YEAR = 2100;

/** Convert YYYY-MM-DD → Date (local midnight). Returns undefined for empty / invalid. */
function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Convert Date → YYYY-MM-DD string. */
function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date | undefined): string {
  if (!d) return '';
  return formatDisplayDate(dateToYmd(d));
}

function parseYearBound(ymd: string | undefined, fallback: number): number {
  if (!ymd) return fallback;
  const [y] = ymd.split('-').map(Number);
  return y || fallback;
}

function PickerSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex w-full cursor-default select-none items-center justify-center rounded-md px-2 py-1.5 text-center text-xs outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function DatePickerCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  onClose,
}: {
  value: string;
  onChange: (ymd: string) => void;
  minDate?: string;
  maxDate?: string;
  onClose: () => void;
}) {
  const selected = ymdToDate(value);
  const minD = ymdToDate(minDate ?? '');
  const maxD = ymdToDate(maxDate ?? '');
  const minYear = parseYearBound(minDate, DEFAULT_FROM_YEAR);
  const maxYear = parseYearBound(maxDate, DEFAULT_TO_YEAR);

  const [viewMonth, setViewMonth] = React.useState(() => selected ?? new Date());

  React.useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [value]);

  const years = React.useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear],
  );

  const startMonth = React.useMemo(
    () => minD
      ? new Date(minD.getFullYear(), minD.getMonth(), 1)
      : new Date(DEFAULT_FROM_YEAR, 0, 1),
    [minD],
  );

  const endMonth = React.useMemo(
    () => maxD
      ? new Date(maxD.getFullYear(), maxD.getMonth(), 1)
      : new Date(DEFAULT_TO_YEAR, 11, 1),
    [maxD],
  );

  const disabledMatchers = React.useMemo((): Matcher | Matcher[] | undefined => {
    const list: Matcher[] = [];
    if (minD) list.push({ before: minD });
    if (maxD) list.push({ after: maxD });
    if (list.length === 0) return undefined;
    return list.length === 1 ? list[0]! : list;
  }, [minD, maxD]);

  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();

  const shiftMonth = (delta: number) => {
    setViewMonth(new Date(viewYear, viewMonthIndex + delta, 1));
  };

  const setMonthIndex = (monthIndex: number) => {
    setViewMonth(new Date(viewYear, monthIndex, 1));
  };

  const setYear = (year: number) => {
    setViewMonth(new Date(year, viewMonthIndex, 1));
  };

  const pickerSelectTrigger = cn(
    'h-8 w-[4.75rem] shrink-0 border-border/60 bg-muted/30 px-2 text-xs font-semibold shadow-none',
    'focus:ring-primary/25 [&>span]:min-w-0 [&>span]:truncate [&>span]:text-center',
  );

  const pickerSelectContent = cn(
    'max-h-48 min-w-0 w-[var(--radix-select-trigger-width)] overflow-y-auto p-1',
  );

  return (
    <div className="w-[19.5rem]">
      {/* Month / year header */}
      <div className="flex items-center gap-1 border-b border-border/50 px-2 py-2.5">
        <button
          type="button"
          aria-label="الشهر التالي"
          onClick={() => shiftMonth(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5">
          <Select value={String(viewMonthIndex)} onValueChange={(v) => setMonthIndex(Number(v))}>
            <SelectTrigger className={pickerSelectTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="center" sideOffset={4} className={pickerSelectContent}>
              {AR_MONTHS.map((label, idx) => (
                <PickerSelectItem key={label} value={String(idx)}>{label}</PickerSelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(viewYear)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className={cn(pickerSelectTrigger, 'font-mono tabular-nums')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="center" sideOffset={4} className={pickerSelectContent}>
              {years.map((year) => (
                <PickerSelectItem key={year} value={String(year)} className="font-mono tabular-nums">
                  {year}
                </PickerSelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          aria-label="الشهر السابق"
          onClick={() => shiftMonth(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day grid */}
      <div className="date-picker-calendar overflow-visible px-3 pb-3 pt-2">
        <Calendar
          mode="single"
          month={viewMonth}
          onMonthChange={setViewMonth}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(dateToYmd(d));
              onClose();
            }
          }}
          disabled={disabledMatchers}
          startMonth={startMonth}
          endMonth={endMonth}
          hideNavigation
          className="p-0"
          classNames={{
            month: 'w-full',
            month_grid: 'w-full border-collapse',
            month_caption: 'hidden',
            nav: 'hidden',
            button_previous: 'hidden',
            button_next: 'hidden',
            weekdays: 'mb-1',
            weekday: 'h-8 w-9 p-0 text-center text-[10px] font-semibold text-muted-foreground',
            weeks: 'w-full',
            week: 'mt-0',
            day: 'h-9 w-9 p-0 text-center align-middle',
          }}
        />
      </div>
    </div>
  );
}

export interface DatePickerInputProps {
  /** Value as YYYY-MM-DD string */
  value: string;
  /** Called with YYYY-MM-DD string when a date is selected */
  onChange: (ymd: string) => void;
  placeholder?: string;
  /** Minimum selectable date as YYYY-MM-DD */
  minDate?: string;
  /** Maximum selectable date as YYYY-MM-DD */
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /**
   * Optional portal container for the popover (defaults to document body).
   * Only pass a dialog element when you need wheel-scroll inside react-remove-scroll.
   */
  popoverContainer?: HTMLElement | DocumentFragment | null;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'اختر تاريخاً',
  minDate,
  maxDate,
  disabled,
  className,
  id,
  popoverContainer,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const dialogContainer = useDialogPortalContainer();
  const selected = ymdToDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start gap-2.5 rounded-lg text-sm font-normal transition-all',
            'hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30',
            selected
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'text-muted-foreground',
            open && 'border-primary/50 ring-2 ring-primary/20',
            className,
          )}
        >
          <CalendarDays className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'opacity-60')} />
          <span className="font-mono tabular-nums" dir="ltr">
            {selected ? formatDisplay(selected) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-visible rounded-2xl border border-border/60 bg-popover p-0 shadow-elevated"
        align="start"
        sideOffset={8}
        dir="rtl"
        container={popoverContainer ?? dialogContainer ?? undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DatePickerCalendar
          value={value}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

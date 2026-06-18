'use client';

import * as React from 'react';
import { Search, X, ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

// ─── types ────────────────────────────────────────────────────────────────────

export type DateRangeValue = { from: string; to: string };
export type FilterMode = 'range' | 'month';

export interface DateRangePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateRangeValue;
  onApply: (range: DateRangeValue, mode: FilterMode) => void;
  maxDays?: number;
  restrictToConsecutive?: boolean;
  allowSingleDate?: boolean;
  disablePastDates?: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getTodayString(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return formatDate(t);
}

function monthStartOffset(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 1) % 7;
}

function areConsecutive(a: string, b: string): boolean {
  const d1 = ymdToDate(a), d2 = ymdToDate(b);
  if (!d1 || !d2) return false;
  return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / 86_400_000) === 1;
}

function daysDiff(a: string, b: string): number {
  const d1 = ymdToDate(a), d2 = ymdToDate(b);
  if (!d1 || !d2) return 0;
  return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / 86_400_000) + 1;
}

function displayDate(ymd: string): string {
  const d = ymdToDate(ymd);
  if (!d) return '—';
  return d.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' });
}

const DAY_LABELS  = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// ─── tab pill ─────────────────────────────────────────────────────────────────

function TabPill({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function DateRangePicker({
  open,
  onOpenChange,
  value,
  onApply,
  maxDays,
  restrictToConsecutive = false,
  allowSingleDate = true,
  disablePastDates = false,
}: DateRangePickerProps) {
  const [mode, setMode] = React.useState<FilterMode>('range');

  // ── range state ──
  const [tempStart, setTempStart] = React.useState<string | null>(null);
  const [tempEnd,   setTempEnd]   = React.useState<string | null>(null);
  const [hovered,   setHovered]   = React.useState<string | null>(null);
  const [error,     setError]     = React.useState<string | null>(null);

  // ── range nav ──
  const [currentDate, setCurrentDate] = React.useState(() => {
    const n = new Date(); n.setDate(1); return n;
  });

  // ── month state — single pick ──
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [yearView, setYearView] = React.useState(() => new Date().getFullYear());

  // ── sync on open ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    setTempStart(value.from || null);
    setTempEnd(value.to || null);
    setHovered(null);
    setError(null);
    setSelectedMonth(null);
    const anchor = ymdToDate(value.from) ?? ymdToDate(value.to);
    const base = anchor ?? new Date();
    setCurrentDate(new Date(base.getFullYear(), base.getMonth(), 1));
    setYearView(base.getFullYear());
  }, [open]);

  // ── validation ────────────────────────────────────────────────────────────────
  const validate = React.useCallback(
    (s: string | null, e: string | null): string | null => {
      if (!s && !e) return null;
      if (allowSingleDate && s && !e) return null;
      if (restrictToConsecutive && s && e && !areConsecutive(s, e))
        return 'يجب اختيار يومين متتاليين فقط';
      if (maxDays && s && e && daysDiff(s, e) > maxDays)
        return `النطاق الزمني لا يمكن أن يتجاوز ${maxDays} أيام`;
      return null;
    },
    [allowSingleDate, maxDays, restrictToConsecutive],
  );

  const withinMaxRange = (ds: string): boolean => {
    if (!maxDays || !tempStart || tempEnd) return true;
    const s = ymdToDate(tempStart), d = ymdToDate(ds);
    if (!s || !d) return true;
    const cap = new Date(s); cap.setDate(cap.getDate() + maxDays - 1);
    return d >= s && d <= cap;
  };

  // ── day click ─────────────────────────────────────────────────────────────────
  const handleDayClick = (ds: string) => {
    let ns = tempStart, ne = tempEnd;
    if (!ns || (ns && ne))  { ns = ds; ne = null; }
    else if (ds === ns)     { if (allowSingleDate) { ne = ds; } else { ns = null; ne = null; } }
    else                    { const sorted = [ns, ds].sort(); ns = sorted[0]; ne = sorted[1]; }
    setHovered(null);
    setTempStart(ns);
    setTempEnd(ne);
    setError(validate(ns, ne));
  };

  // ── month click — single select / deselect ────────────────────────────────────
  const handleMonthClick = (year: number, monthIdx: number) => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    setSelectedMonth(prev => (prev === key ? null : key));
  };

  // ── apply ─────────────────────────────────────────────────────────────────────
  const handleApply = () => {
    if (mode === 'range') {
      const err = validate(tempStart, tempEnd);
      if (err) { setError(err); return; }
      onApply({ from: tempStart ?? '', to: tempEnd ?? '' }, 'range');
    } else {
      if (!selectedMonth) return;
      const [y, m] = selectedMonth.split('-').map(Number);
      const from = formatDate(new Date(y, m - 1, 1));
      const to   = formatDate(new Date(y, m, 0)); // last day of month
      onApply({ from, to }, 'month');
    }
    onOpenChange(false);
  };

  const handleCancel = () => onOpenChange(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTempStart(value.from || null);
      setTempEnd(value.to || null);
      setHovered(null);
      setError(null);
      setSelectedMonth(null);
    }
    onOpenChange(next);
  };

  // ── hover preview ─────────────────────────────────────────────────────────────
  const isHoverMode    = Boolean(tempStart && !tempEnd);
  const effectiveHover = isHoverMode && hovered && hovered !== tempStart ? hovered : null;
  const rangeEnd       = effectiveHover ? [tempStart!, effectiveHover].sort()[1] : tempEnd;
  const rangeStart     = effectiveHover ? [tempStart!, effectiveHover].sort()[0] : tempStart;
  const hasVisualRange = Boolean(rangeStart && rangeEnd && rangeStart !== rangeEnd);

  // ── can apply ─────────────────────────────────────────────────────────────────
  const canApply = mode === 'range'
    ? Boolean(!error && (tempStart || tempEnd))
    : Boolean(selectedMonth);

  // ── render: day cells ─────────────────────────────────────────────────────────
  const renderDayCells = () => {
    const year        = currentDate.getFullYear();
    const month       = currentDate.getMonth();
    const offset      = monthStartOffset(year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today       = getTodayString();
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const ds          = formatDate(new Date(year, month, day));
      const disabled    = !withinMaxRange(ds) || (disablePastDates && ds < today);
      const isConfStart = ds === tempStart;
      const isConfEnd   = ds === tempEnd;
      const isVisStart  = ds === rangeStart && hasVisualRange;
      const isVisEnd    = ds === rangeEnd   && hasVisualRange;
      const inRange     = Boolean(rangeStart && rangeEnd && ds > rangeStart && ds < rangeEnd);
      const isFilled    = isConfStart || isConfEnd;
      const isSoloDot   = isFilled && !hasVisualRange;
      const showToday   = ds === today && !isFilled && !inRange;

      cells.push(
        <div
          key={ds}
          onMouseEnter={() => {
            if (isHoverMode) setHovered(ds);
          }}
          className={cn(
            'relative flex h-10 items-center justify-center',
            inRange                  && 'bg-primary/12',
            isVisStart && !isSoloDot && 'bg-primary/12 rounded-r-full',
            isVisEnd   && !isSoloDot && 'bg-primary/12 rounded-l-full',
          )}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && handleDayClick(ds)}
            className={cn(
              'relative z-10 flex h-9 w-9 items-center justify-center rounded-full',
              'text-sm font-medium transition-colors duration-100 select-none focus-visible:outline-none',
              disabled && 'cursor-not-allowed opacity-30 text-muted-foreground',
              !disabled && !isFilled && !inRange && 'cursor-pointer text-foreground hover:bg-primary/15',
              !disabled && inRange && !isFilled  && 'cursor-pointer text-primary font-semibold hover:bg-primary/25',
              showToday && !disabled && 'ring-2 ring-primary/50 ring-offset-1 text-primary font-bold',
              isFilled && !disabled  && 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
            )}
          >
            {day}
          </button>
        </div>,
      );
    }
    return cells;
  };

  // ── render: month grid — single select ────────────────────────────────────────
  const renderMonthGrid = () => {
    const thisYear  = new Date().getFullYear();
    const thisMonth = new Date().getMonth();

    return MONTH_NAMES.map((name, idx) => {
      const key       = `${yearView}-${String(idx + 1).padStart(2, '0')}`;
      const selected  = selectedMonth === key;
      const isPast    = disablePastDates &&
        (yearView < thisYear || (yearView === thisYear && idx < thisMonth));
      const isCurrent = yearView === thisYear && idx === thisMonth;

      return (
        <button
          key={key}
          type="button"
          disabled={isPast}
          onClick={() => !isPast && handleMonthClick(yearView, idx)}
          className={cn(
            'flex h-10 items-center justify-center rounded-xl text-sm font-medium',
            'transition-all duration-150 focus-visible:outline-none select-none',
            isPast    && 'cursor-not-allowed opacity-30 text-muted-foreground',
            !isPast && !selected && 'cursor-pointer text-foreground hover:bg-primary/15',
            selected  && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
            isCurrent && !selected && !isPast &&
              'ring-2 ring-primary/50 ring-offset-1 text-primary font-bold',
          )}
        >
          {name}
        </button>
      );
    });
  };

  const rangeMonthLabel = currentDate.toLocaleDateString('ar', { month: 'long', year: 'numeric' });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="max-w-[356px] gap-0 p-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl"
        dir="rtl"
      >
        <div className="relative">
        <DialogClose
          className="absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </DialogClose>

        <DialogTitle className="sr-only">اختيار نطاق التاريخ</DialogTitle>
        {/* ── Tab switcher ── */}
        <div className="px-4 pt-11 pb-3 border-b border-border/40">
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            <TabPill
              active={mode === 'range'}
              onClick={() => { setMode('range'); setError(null); }}
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="نطاق تاريخ"
            />
            <TabPill
              active={mode === 'month'}
              onClick={() => { setMode('month'); setError(null); }}
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="شهر"
            />
          </div>
        </div>

        {/* ══ Range tab ══ */}
        {mode === 'range' && (
          <>
            {/* Month nav */}
            <DialogHeader className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setHovered(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); }}
                  aria-label="الشهر التالي"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[15px] font-bold tracking-wide text-foreground">
                  {rangeMonthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => { setHovered(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); }}
                  aria-label="الشهر السابق"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </DialogHeader>

            <div className="px-3 pb-2">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="flex h-7 items-center justify-center text-[10px] font-semibold tracking-wider text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div
                className="grid grid-cols-7"
                style={{ gap: 0 }}
                onMouseLeave={() => setHovered(null)}
              >
                {renderDayCells()}
              </div>

              {/* Hint */}
              {maxDays && tempStart && !tempEnd && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  يمكنك اختيار حتى {maxDays} أيام
                </p>
              )}

              {/* From / To chips */}
              <div className="mt-3 mb-1 grid grid-cols-2 gap-2">
                <div className={cn(
                  'flex flex-col items-center rounded-xl border px-3 py-2 text-center transition-all duration-150',
                  tempStart ? 'border-primary/40 bg-primary/8' : 'border-border/50 bg-muted/30',
                )}>
                  <span className="mb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground">من</span>
                  <span className={cn('text-xs font-medium', tempStart ? 'text-foreground' : 'text-muted-foreground/50')}>
                    {tempStart ? displayDate(tempStart) : '—'}
                  </span>
                </div>
                <div className={cn(
                  'flex flex-col items-center rounded-xl border px-3 py-2 text-center transition-all duration-150',
                  tempEnd ? 'border-primary/40 bg-primary/8' : 'border-border/50 bg-muted/30',
                )}>
                  <span className="mb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground">إلى</span>
                  <span className={cn('text-xs font-medium', tempEnd ? 'text-foreground' : 'text-muted-foreground/50')}>
                    {tempEnd ? displayDate(tempEnd) : '—'}
                  </span>
                </div>
              </div>

              {error && (
                <p className="mt-1.5 text-center text-xs font-medium text-destructive">{error}</p>
              )}
            </div>
          </>
        )}

        {/* ══ Month tab ══ */}
        {mode === 'month' && (
          <div className="px-4 pt-4 pb-3">
            {/* Year nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setYearView(y => y + 1)}
                aria-label="السنة التالية"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[15px] font-bold tracking-wide text-foreground">{yearView}</span>
              <button
                type="button"
                onClick={() => setYearView(y => y - 1)}
                aria-label="السنة السابقة"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 3×4 month grid */}
            <div className="grid grid-cols-3 gap-2">
              {renderMonthGrid()}
            </div>

            {/* Selected month summary */}
            {selectedMonth && (() => {
              const [y, m] = selectedMonth.split('-').map(Number);
              return (
                <div className="mt-4 rounded-xl border border-primary/40 bg-primary/8 px-3 py-2.5 text-center">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground block mb-0.5">
                    الشهر المحدد
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {MONTH_NAMES[m - 1]} {y}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Footer ── */}
        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            size="sm"
            disabled={!canApply}
            onClick={handleApply}
            className="gap-1.5 rounded-xl font-semibold"
          >
            <Search className="h-3.5 w-3.5" />
            تطبيق
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="gap-1.5 rounded-xl"
          >
            <X className="h-3.5 w-3.5" />
            إلغاء
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DateRangePicker;
'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ShiftPeriod } from '@/features/hr/attendance/lib/types';
import { cn } from '@/shared/utils';
import { ShiftScheduleForm } from '@/features/hr/attendance/templates/components/shift-schedule-form';
import { durationLabel } from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftPeriodRow({
  period,
  index,
  total,
  accentClass,
  periodBgClass,
  onRemove,
  onChange,
}: {
  period: ShiftPeriod;
  index: number;
  total: number;
  accentClass: string;
  periodBgClass: string;
  onRemove: () => void;
  onChange: (p: ShiftPeriod) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const dur = durationLabel(period.startTime, period.endTime);

  return (
    <div className={cn('border-s-[3px] transition-colors', accentClass, periodBgClass)}>
      <div className="flex w-full min-h-[2.75rem] items-stretch">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5 text-start transition-colors hover:bg-muted/20"
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200',
              collapsed && '-rotate-90',
            )}
          />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {total > 1 ? `الفترة ${index + 1}` : 'فترة الدوام'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {period.startTime} ← {period.endTime}
          </span>
          {dur && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{dur}</span>
          )}
          {period.strictMode && period.strictPenaltyBalanceEnabled && (
            <span className="hidden rounded-full bg-muted/80 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:inline">
              رصيد −{period.strictPenaltyBalanceDays}
            </span>
          )}
          {period.strictMode && period.strictPenaltyWarning && (
            <span className="hidden rounded-full bg-warning/15 px-2 py-0.5 text-[9px] font-semibold text-warning sm:inline">
              إنذار
            </span>
          )}
        </button>

        <div
          className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-s border-border/60 bg-muted/[0.35] px-3 py-2"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <span className="max-w-[4.5rem] text-center text-[9px] font-bold leading-tight text-muted-foreground">
            دوام صارم
          </span>
          <Switch
            checked={period.strictMode}
            onCheckedChange={(v) =>
              onChange({
                ...period,
                strictMode: v,
                ...(!v
                  ? {
                      strictPenaltyWarning: false,
                      strictPenaltyBalanceEnabled: false,
                    }
                  : {}),
              })
            }
            className="data-[state=checked]:bg-destructive"
          />
        </div>

        {total > 1 && (
          <div className="flex items-center pe-2">
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" /> حذف
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1">
          <ShiftScheduleForm period={period} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

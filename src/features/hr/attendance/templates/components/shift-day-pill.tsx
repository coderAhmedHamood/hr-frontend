'use client';

import type { WeekDayIndex } from '@/features/hr/attendance/lib/types';
import { cn } from '@/shared/utils';
import { DAY_LABELS } from '@/features/hr/attendance/templates/constants/shift-templates-ui';

export function ShiftDayPill({
  day,
  isRest,
  onClick,
}: {
  day: WeekDayIndex;
  isRest: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={DAY_LABELS[day]}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-0.5 py-2.5 text-center transition-all duration-150 select-none',
        isRest
          ? 'border-border/50 bg-muted/20 text-muted-foreground/50 hover:border-border hover:bg-muted/30'
          : 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10',
      )}
    >
      <span className="line-clamp-2 text-[10px] font-bold leading-tight">{DAY_LABELS[day]}</span>
      <span className={cn('h-1.5 w-1.5 rounded-full', isRest ? 'bg-muted-foreground/30' : 'bg-primary')} />
    </button>
  );
}

'use client';

import { cn } from '@/shared/utils';
import { STATUS, type StatusVisualKey } from '@/features/hr/attendance/daily/constants/daily-attendance-status';

export function DailyAttendanceLegend({ inline }: { inline?: boolean }) {
  const items = Object.entries(STATUS) as [StatusVisualKey, (typeof STATUS)[StatusVisualKey]][];
  if (inline) {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 border-t border-border bg-muted/20 px-5 py-3">
      {items.map(([, cfg]) => (
        <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

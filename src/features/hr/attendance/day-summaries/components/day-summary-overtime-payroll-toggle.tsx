'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { cn } from '@/shared/utils';

type DaySummaryOvertimePayrollToggleProps = {
  row: DaySummaryResponseDto;
  disabled?: boolean;
  onToggle: (row: DaySummaryResponseDto, allowed: boolean) => void;
};

export function canToggleOvertimePayroll(row: DaySummaryResponseDto): boolean {
  if (row.isFinalized) return false;
  if (row.overtimePayrollAllowed) return true;
  return row.canAllowOvertimeForPayroll === true;
}

export function DaySummaryOvertimePayrollToggle({
  row,
  disabled = false,
  onToggle,
}: DaySummaryOvertimePayrollToggleProps) {
  const allowed = row.overtimePayrollAllowed === true;
  const canToggle = canToggleOvertimePayroll(row);

  if (!canToggle && !allowed) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div
      className="flex items-center justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Switch
        checked={allowed}
        disabled={disabled || !canToggle}
        aria-label={allowed ? 'إلغاء السماح باحتساب الإضافي في الرواتب' : 'السماح باحتساب الإضافي في الرواتب'}
        onCheckedChange={(checked) => onToggle(row, checked)}
      />
      {allowed ? (
        <Badge
          variant="outline"
          className={cn('text-[10px] font-normal text-success border-success/30 bg-success/10')}
        >
          مسموح
        </Badge>
      ) : null}
    </div>
  );
}

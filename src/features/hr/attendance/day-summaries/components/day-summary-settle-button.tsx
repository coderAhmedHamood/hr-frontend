'use client';

import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { canSettleDaySummary } from '@/features/hr/attendance/day-summaries/utils/day-summary-settle';

type DaySummarySettleButtonProps = {
  row: DaySummaryResponseDto;
  onRequestSettle: (row: DaySummaryResponseDto) => void;
};

export function DaySummarySettleButton({ row, onRequestSettle }: DaySummarySettleButtonProps) {
  if (row.isSettled) {
    return (
      <Badge variant="outline" className="text-[10px] font-normal">
        مُسوّى
      </Badge>
    );
  }

  if (!canSettleDaySummary(row)) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 gap-1 px-2 text-xs"
      aria-label="تسوية النقص من الإضافي"
      onClick={(e) => {
        e.stopPropagation();
        onRequestSettle(row);
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
      تسوية
    </Button>
  );
}

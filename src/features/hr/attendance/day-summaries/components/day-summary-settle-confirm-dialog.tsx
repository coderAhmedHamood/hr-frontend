'use client';

import * as React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { computeDaySummarySettlePlan } from '@/features/hr/attendance/day-summaries/utils/day-summary-settle';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { TableDateCell } from '@/components/ui/table-cells';

type DaySummarySettleConfirmDialogProps = {
  row: DaySummaryResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  submitting?: boolean;
};

function MetricPreview({
  label,
  before,
  after,
  tone,
}: {
  label: string;
  before: number;
  after: number;
  tone?: 'default' | 'success' | 'destructive';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold tabular-nums ${toneClass}`}>
        {minutesToHHMM(before)}
        <span className="mx-1 text-muted-foreground">→</span>
        {minutesToHHMM(after)}
      </p>
    </div>
  );
}

export function DaySummarySettleConfirmDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}: DaySummarySettleConfirmDialogProps) {
  if (!row) return null;

  const plan = computeDaySummarySettlePlan(row);
  const partialShortage = plan.after.shortageMinutes > 0;
  const surplusPool =
    plan.after.outsidePeriodMinutes + plan.after.overtimeMinutes > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-visible border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-primary/8 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-base">تسوية الحضور</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              تسوية بين <span className="font-semibold text-destructive">النقص</span> و{' '}
              <span className="font-semibold text-success">رصيد الإضافي</span> (خارج الفترات + إضافي): يُنقَل{' '}
              <span className="font-semibold text-foreground">{minutesToHHMM(plan.transferMinutes)}</span>{' '}
              (أقلّ القيمتين).
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium">{row.employeeNameAr ?? '—'}</p>
            <p className="mt-1 text-muted-foreground">
              <TableDateCell value={row.workDate} />
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm">
              تحويل{' '}
              <span className="font-mono font-semibold tabular-nums text-primary">
                {minutesToHHMM(plan.transferMinutes)}
              </span>{' '}
              من الإضافي → سد النقص
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricPreview
              label="نقص"
              before={plan.shortageMinutes}
              after={plan.after.shortageMinutes}
              tone="destructive"
            />
            <MetricPreview
              label="خارج الفترات"
              before={plan.outsidePeriodMinutes}
              after={plan.after.outsidePeriodMinutes}
              tone="success"
            />
            <MetricPreview
              label="إضافي"
              before={plan.overtimeMinutes}
              after={plan.after.overtimeMinutes}
              tone="default"
            />
          </div>

          {partialShortage ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              رصيد الإضافي أقل من النقص — تسوية جزئية، يبقى نقص{' '}
              <span className="font-mono font-medium text-destructive">
                {minutesToHHMM(plan.after.shortageMinutes)}
              </span>
              .
            </p>
          ) : surplusPool ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              بعد التسوية الكاملة للنقص، يبقى رصيد إضافي{' '}
              <span className="font-mono font-medium text-success">
                {minutesToHHMM(plan.after.outsidePeriodMinutes + plan.after.overtimeMinutes)}
              </span>
              .
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              تسوية كاملة — لا نقص ولا رصيد خارج متبقٍ.
            </p>
          )}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void onConfirm()}>
            {submitting ? 'جاري التسوية…' : 'تأكيد التسوية'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

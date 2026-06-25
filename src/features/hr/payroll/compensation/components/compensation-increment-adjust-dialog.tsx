'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';
import { formatLatinNumber } from '@/features/hr/payroll/lib/compensation-preview';
import type { IncrementAdjustField } from '@/features/hr/payroll/compensation/services/incremental-monthly-input.service';

export type IncrementAdjustDialogContext = {
  employeeId: string;
  employeeName: string;
  field: IncrementAdjustField;
  currentTotal: number;
  currency: string;
};

type Props = {
  open: boolean;
  context: IncrementAdjustDialogContext | null;
  submitting: boolean;
  onConfirm: (payload: {
    amount: number;
    direction: 'addition' | 'deduction';
    note: string;
  }) => void;
  onCancel: () => void;
};

const numberInputClass =
  'font-mono text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function preventWheelChange(e: React.WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}

function parsePositiveAmount(raw: string): number | null {
  const n = parseFloat(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function CompensationIncrementAdjustDialog({
  open,
  context,
  submitting,
  onConfirm,
  onCancel,
}: Props) {
  const [amountRaw, setAmountRaw] = React.useState('');
  const [direction, setDirection] = React.useState<'addition' | 'deduction'>('addition');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setAmountRaw('');
      setDirection('addition');
      setNote('');
      setError(null);
    }
  }, [open, context?.employeeId, context?.field]);

  if (!context) return null;

  const isBonus = context.field === 'bonus';
  const increment = parsePositiveAmount(amountRaw);
  const projectedTotal = increment == null
    ? context.currentTotal
    : isBonus
      ? context.currentTotal + increment
      : direction === 'addition'
        ? context.currentTotal + increment
        : context.currentTotal - increment;

  const handleSubmit = () => {
    const amount = parsePositiveAmount(amountRaw);
    if (amount == null) {
      setError('أدخل مبلغاً أكبر من صفر');
      return;
    }
    if (!isBonus && direction === 'deduction' && projectedTotal < 0) {
      setError('لا يمكن أن يصبح الرصيد سالباً');
      return;
    }
    setError(null);
    onConfirm({
      amount,
      direction: isBonus ? 'addition' : direction,
      note: note.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !submitting) onCancel(); }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-primary/8 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-base">
              {isBonus ? 'إضافة مكافأة' : 'خصم أو إضافة مباشرة'}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {isBonus
                ? <>أدخل المبلغ الذي تريد <span className="font-semibold text-foreground">إضافته</span> إلى مكافآت الموظف <span className="font-semibold text-foreground">{context.employeeName}</span>.</>
                : <>اختر نوع العملية والمبلغ لـ <span className="font-semibold text-foreground">{context.employeeName}</span>. يُضاف المبلغ أو يُخصم من الرصيد الحالي.</>}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">الرصيد الحالي</p>
            <p className={cn(
              'mt-1 font-mono text-xl font-bold tabular-nums',
              !isBonus && context.currentTotal > 0 && 'text-primary',
              !isBonus && context.currentTotal < 0 && 'text-destructive',
              (isBonus || context.currentTotal === 0) && 'text-foreground',
            )}>
              {formatLatinNumber(context.currentTotal, 2)} {context.currency}
            </p>
          </div>

          {!isBonus && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">نوع العملية</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDirection('addition')}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                    direction === 'addition'
                      ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                  )}
                >
                  إضافة
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDirection('deduction')}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                    direction === 'deduction'
                      ? 'border-destructive bg-destructive text-destructive-foreground shadow-soft'
                      : 'border-border bg-card text-muted-foreground hover:border-destructive/40',
                  )}
                >
                  خصم
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="increment-amount" className="text-xs font-medium text-muted-foreground">
              {isBonus ? 'المبلغ المراد إضافته' : 'المبلغ'}
            </Label>
            <Input
              id="increment-amount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={amountRaw}
              disabled={submitting}
              onChange={(e) => { setAmountRaw(e.target.value); setError(null); }}
              onWheel={preventWheelChange}
              placeholder="0.00"
              className={numberInputClass}
            />
          </div>

          {increment != null && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">الرصيد بعد العملية</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-primary">
                {formatLatinNumber(projectedTotal, 2)} {context.currency}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="increment-note" className="text-xs font-medium text-muted-foreground">
              ملاحظات (اختياري)
            </Label>
            <Textarea
              id="increment-note"
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب الإضافة أو الخصم…"
              rows={2}
              className="min-h-[3.5rem] resize-none text-sm"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
          </Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

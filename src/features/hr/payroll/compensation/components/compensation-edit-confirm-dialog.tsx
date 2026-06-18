'use client';

import * as React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatLatinNumber } from '@/features/hr/payroll/lib/compensation-preview';

type Props = {
  open: boolean;
  employeeName: string;
  fieldLabel: string;
  previousValue: string;
  newValue: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
};

function displayAmount(raw: string): string {
  const n = parseFloat(raw);
  return formatLatinNumber(Number.isFinite(n) ? n : 0, 2);
}

export function CompensationEditConfirmDialog({
  open,
  employeeName,
  fieldLabel,
  previousValue,
  newValue,
  onConfirm,
  onCancel,
}: Props) {
  const [actionsReady, setActionsReady] = React.useState(false);
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setActionsReady(false);
      setNotes('');
      return;
    }
    const timer = window.setTimeout(() => setActionsReady(true), 200);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden border-border p-0"
        dir="rtl"
        onOpenAutoFocus={e => e.preventDefault()}
        onKeyDown={e => {
          if (e.key === 'Enter' && !actionsReady) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="border-b border-border/60 bg-linear-to-b from-warning/8 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-base">تأكيد تعديل قيمة الموظف</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              أنت على وشك تغيير قيمة <span className="font-semibold text-foreground">{fieldLabel}</span> للموظف{' '}
              <span className="font-semibold text-foreground">{employeeName}</span>. هل تريد حفظ هذا التعديل؟
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">القيمة السابقة</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-muted-foreground">
                {displayAmount(previousValue)}
              </p>
            </div>
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">القيمة الجديدة</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-primary">
                {displayAmount(newValue)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compensation-edit-notes" className="text-xs font-medium text-muted-foreground">
              ملاحظات (اختياري)
            </Label>
            <Textarea
              id="compensation-edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="أضف ملاحظة توضّح سبب التعديل…"
              rows={3}
              className="min-h-[4.5rem] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            disabled={!actionsReady}
            onClick={() => { if (actionsReady) onConfirm(notes); }}
          >
            نعم، احفظ التعديل
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

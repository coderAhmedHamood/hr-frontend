'use client';

import * as React from 'react';
import { AlertTriangle, Bell, FileSignature, Loader2, Receipt } from 'lucide-react';
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
import type { PayrollNotifyDeliveryMode } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodLabel: string;
  employeeCount: number;
  busy: boolean;
  onConfirm: (deliveryMode: PayrollNotifyDeliveryMode) => void;
};

const DELIVERY_OPTIONS: {
  value: PayrollNotifyDeliveryMode;
  title: string;
  description: string;
}[] = [
  {
    value: 'notify_only',
    title: 'إشعار فقط',
    description: 'إرسال إشعار بمراجعة قسيمة الراتب والموافقة عليها دون سند راتب.',
  },
  {
    value: 'pdf_sign',
    title: 'سند راتب للتأكيد فقط',
    description:
      'إنشاء سند راتب لكل موظف وإرسال إشعار لفتحه وقراءته والتأكيد بالتوقيع.',
  },
  {
    value: 'both',
    title: 'الإثنان معاً',
    description: 'إشعار القسيمة + سند الراتب للتأكيد في نفس الخطوة.',
  },
];

export function CompleteReviewPayslipsDialog({
  open,
  onOpenChange,
  periodLabel,
  employeeCount,
  busy,
  onConfirm,
}: Props) {
  const [deliveryMode, setDeliveryMode] =
    React.useState<PayrollNotifyDeliveryMode>('both');

  React.useEffect(() => {
    if (open) setDeliveryMode('both');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-visible border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-warning/10 via-warning/5 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-3 text-right">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="font-display text-base leading-snug">
                  إتمام المراجعة الثالثة
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                  {periodLabel}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-foreground">
            بعد هذي المراجعة سوف يتم انشاء قسيمة براتب الموظفين ولا يمكنك التراجع.
          </p>
          <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 px-3 py-3">
            <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              سيتم توليد قسائم مسودة لجميع الموظفين في هذه الفترة بناءً على بيانات المستحقات الحالية.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              بعد الموافقة — ماذا يُرسل للموظفين؟
            </div>
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map((opt) => {
                const selected = deliveryMode === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-3 transition-colors ${
                      selected
                        ? 'border-primary/40 bg-primary/8'
                        : 'border-border/70 bg-muted/20 hover:bg-muted/35'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payroll-delivery-mode"
                      className="mt-1"
                      checked={selected}
                      disabled={busy}
                      onChange={() => setDeliveryMode(opt.value)}
                    />
                    <span className="space-y-0.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        {opt.value !== 'notify_only' ? (
                          <FileSignature className="h-3.5 w-3.5 text-primary" />
                        ) : null}
                        {opt.title}
                      </span>
                      <span className="block text-[11px] leading-relaxed text-muted-foreground">
                        {opt.description}
                        {employeeCount > 0
                          ? ` (≈ ${employeeCount} موظفاً)`
                          : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button disabled={busy} onClick={() => onConfirm(deliveryMode)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد وإنشاء القسائم'}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

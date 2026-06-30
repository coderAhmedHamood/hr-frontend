'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeHrPdfPrepKind } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRosePdf';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MinimalDropdown } from '@/components/ui/shared-dialogs';
import { REASON_LABELS, type CashReceiptReason } from '@/features/hr/payroll/reports/components/pdf-cash-receipt-print-html';

type Props = {
  open: boolean;
  prepKind: EmployeeHrPdfPrepKind;
  employee: Employee;
  onCancel: () => void;
  onApplyCashReceipt: (payload: {
    receipt: {
      amount: number;
      amountWritten: string;
      reason: CashReceiptReason;
      reasonDetail: string;
      date: string;
    };
  }) => void;
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

const CASH_REASON_OPTIONS = (Object.keys(REASON_LABELS) as CashReceiptReason[]).map((k) => ({
  value: k,
  label: REASON_LABELS[k],
}));

export function EmployeeHrPdfPrepDialog({ open, prepKind, employee, onCancel, onApplyCashReceipt }: Props) {
  const [cashAmt, setCashAmt] = React.useState('');
  const [cashWritten, setCashWritten] = React.useState('');
  const [cashDetail, setCashDetail] = React.useState('—');
  const [cashReason, setCashReason] = React.useState<CashReceiptReason>('salary');
  const [cashDate, setCashDate] = React.useState(todayYmd());

  React.useEffect(() => {
    if (!open) return;
    setCashDate(todayYmd());
  }, [open]);

  if (!prepKind || !open || prepKind !== 'cash-receipt') return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-lg border-border">
        <DialogHeader className="text-right">
          <DialogTitle className="font-display">سند استلام نقدي للراتب</DialogTitle>
          <DialogDescription className="sr-only">أدخل الحقول المطلوبة ثم ولِّد المعاينة</DialogDescription>
          <p className="text-xs text-muted-foreground">
            تم التعبئة الأولية من بيانات الموظف: <span className="font-medium text-foreground">{employee.name}</span>
          </p>
        </DialogHeader>

        <div className="grid gap-3 py-2 text-right">
          <div className="space-y-1.5">
            <Label htmlFor="hr-c-amt">المبلغ (رقماً)</Label>
            <Input id="hr-c-amt" type="number" min="0" value={cashAmt} onChange={(e) => setCashAmt(e.target.value)} className="font-mono" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hr-c-w">المبلغ كتابة (اختياري)</Label>
            <Input id="hr-c-w" value={cashWritten} onChange={(e) => setCashWritten(e.target.value)} className="text-right" dir="rtl" />
          </div>
          <div className="space-y-1.5">
            <Label>نوع الاستلام</Label>
            <MinimalDropdown value={cashReason} onChange={(v) => setCashReason(v as CashReceiptReason)} options={CASH_REASON_OPTIONS} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hr-c-det">التفاصيل (شهر أو وصف مختصر)</Label>
            <Input id="hr-c-det" value={cashDetail} onChange={(e) => setCashDetail(e.target.value)} dir="rtl" className="text-right" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hr-c-dt">التاريخ</Label>
            <DatePickerInput id="hr-c-dt" value={cashDate} onChange={setCashDate} />
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            variant="luxe"
            onClick={() => {
              const amt = Number(cashAmt);
              if (!Number.isFinite(amt) || amt <= 0) {
                toast.error('أدخل مبلغاً صالحاً');
                return;
              }
              onApplyCashReceipt({
                receipt: {
                  amount: amt,
                  amountWritten: cashWritten.trim(),
                  reason: cashReason,
                  reasonDetail: cashDetail.trim() || '—',
                  date: cashDate,
                },
              });
            }}
          >
            إنشاء معاينة PDF
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

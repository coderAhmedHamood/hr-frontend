'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  CASH_RECEIPT_PURPOSES_NEEDING_PERIOD,
  CASH_RECEIPT_VOUCHER_PURPOSE_LABELS,
  type CashReceiptVoucherPurpose,
  type CreateCashReceiptVoucherDto,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import { cashReceiptAutoSnapshot } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';

type FormState = {
  voucherNumber: string;
  receiptDate: string;
  amount: string;
  purpose: CashReceiptVoucherPurpose;
  purposeMonth: string;
  purposeYear: string;
  overtimeDays: string;
  otherDescription: string;
};

function defaultVoucherNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `CRV-${y}${m}${d}-${seq}`;
}

function defaultForm(): FormState {
  const now = new Date();
  return {
    voucherNumber: defaultVoucherNumber(),
    receiptDate: todayIsoDate(),
    amount: '',
    purpose: 'salary',
    purposeMonth: String(now.getMonth() + 1),
    purposeYear: String(now.getFullYear()),
    overtimeDays: '',
    otherDescription: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateCashReceiptVoucherDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeCashReceiptVoucherCreateDialog({
  open,
  employee,
  saving = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const { data: activeCompany } = useActiveCompany();
  const pdfCompany = usePdfCompanyLetterhead();
  const companyNameAr = activeCompany?.nameAr ?? pdfCompany.companyNameAr;
  const [form, setForm] = React.useState<FormState>(defaultForm);

  React.useEffect(() => {
    if (open) setForm(defaultForm());
  }, [open]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const needsPeriod = CASH_RECEIPT_PURPOSES_NEEDING_PERIOD.has(form.purpose);
  const showOvertimeDays = form.purpose === 'overtime';
  const showOtherDescription = form.purpose === 'other';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const voucherNumber = form.voucherNumber.trim();
    const amount = Number(form.amount);
    if (!voucherNumber || !form.receiptDate || !Number.isFinite(amount) || amount <= 0) {
      toast.error('أكمل رقم السند والتاريخ والمبلغ');
      return;
    }

    const purposeMonth = form.purposeMonth ? Number(form.purposeMonth) : null;
    const purposeYear = form.purposeYear ? Number(form.purposeYear) : null;
    const overtimeDays = form.overtimeDays ? Number(form.overtimeDays) : null;

    if (needsPeriod) {
      if (
        purposeMonth == null ||
        !Number.isFinite(purposeMonth) ||
        purposeMonth < 1 ||
        purposeMonth > 12 ||
        purposeYear == null ||
        !Number.isFinite(purposeYear)
      ) {
        toast.error('الشهر والسنة مطلوبان لهذا الغرض');
        return;
      }
    }

    if (showOvertimeDays && (overtimeDays == null || !Number.isFinite(overtimeDays) || overtimeDays < 1)) {
      toast.error('عدد أيام الإضافي مطلوب');
      return;
    }

    if (showOtherDescription && !form.otherDescription.trim()) {
      toast.error('وصف البيان مطلوب عند اختيار «أخرى»');
      return;
    }

    const auto = cashReceiptAutoSnapshot({ employee, companyNameAr });

    const result = await onSubmit({
      voucherNumber,
      receiptDate: form.receiptDate,
      amount,
      // Backend still requires amountInWords — not collected or printed.
      amountInWords: '---',
      purpose: form.purpose,
      purposeMonth: needsPeriod && Number.isFinite(purposeMonth) ? purposeMonth : null,
      purposeYear: needsPeriod && Number.isFinite(purposeYear) ? purposeYear : null,
      overtimeDays: showOvertimeDays && Number.isFinite(overtimeDays) ? overtimeDays : null,
      otherDescription: showOtherDescription ? form.otherDescription.trim() : null,
      ...auto,
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء سند راتب</DialogTitle>
          <DialogDescription>
            أدخل حقول السند فقط — يُملأ تلقائياً على الـ PDF: المستلم، المؤسسة، الفرع، واسم التوقيع من
            بيانات{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
            {employee.branchNameAr ? (
              <>
                {' '}
                (فرع <span className="font-medium text-foreground">{employee.branchNameAr}</span>)
              </>
            ) : null}
            . تواقيع الاعتماد تُترك فارغة للتوقيع اليدوي.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="crv-number">رقم السند</Label>
              <Input
                id="crv-number"
                dir="ltr"
                value={form.voucherNumber}
                onChange={(e) => patch('voucherNumber', e.target.value)}
                placeholder="CRV-20260721-00001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-date">تاريخ السند</Label>
              <DatePickerInput
                id="crv-date"
                value={form.receiptDate}
                onChange={(v) => patch('receiptDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الغرض (وذلك مقابل)</Label>
              <Select
                value={form.purpose}
                onValueChange={(v) => patch('purpose', v as CashReceiptVoucherPurpose)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CASH_RECEIPT_VOUCHER_PURPOSE_LABELS) as CashReceiptVoucherPurpose[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {CASH_RECEIPT_VOUCHER_PURPOSE_LABELS[key]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-amount">المبلغ (رقمًا)</Label>
              <Input
                id="crv-amount"
                type="number"
                min={0}
                step="0.01"
                dir="ltr"
                value={form.amount}
                onChange={(e) => patch('amount', e.target.value)}
                required
              />
            </div>
            {needsPeriod ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-month">الشهر</Label>
                  <Input
                    id="crv-month"
                    type="number"
                    min={1}
                    max={12}
                    dir="ltr"
                    value={form.purposeMonth}
                    onChange={(e) => patch('purposeMonth', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-year">السنة</Label>
                  <Input
                    id="crv-year"
                    type="number"
                    min={2000}
                    dir="ltr"
                    value={form.purposeYear}
                    onChange={(e) => patch('purposeYear', e.target.value)}
                    required
                  />
                </div>
              </>
            ) : null}
            {showOvertimeDays ? (
              <div className="space-y-1.5">
                <Label htmlFor="crv-ot-days">أيام الإضافي</Label>
                <Input
                  id="crv-ot-days"
                  type="number"
                  min={1}
                  dir="ltr"
                  value={form.overtimeDays}
                  onChange={(e) => patch('overtimeDays', e.target.value)}
                  required
                />
              </div>
            ) : null}
            {showOtherDescription ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="crv-other">حدد البيان</Label>
                <Input
                  id="crv-other"
                  value={form.otherDescription}
                  onChange={(e) => patch('otherDescription', e.target.value)}
                  required
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" variant="luxe" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'إنشاء مسودة'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

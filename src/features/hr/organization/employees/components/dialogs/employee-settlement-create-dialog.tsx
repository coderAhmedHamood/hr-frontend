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
import { toast } from 'sonner';
import type { Employee } from '@/features/hr/organization/employees/types';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';

export type CreateSettlementInput = {
  referenceNo: string;
  documentDate: string;
  documentDateHijri?: string | null;
  employeeName: string;
  nationality: string;
  nationalId: string;
  companyNameAr: string;
};

type FormState = {
  referenceNo: string;
  documentDate: string;
  documentDateHijri: string;
};

function defaultDocNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `SET-${y}${m}${d}-${seq}`;
}

function defaultForm(): FormState {
  return {
    referenceNo: defaultDocNumber(),
    documentDate: todayIsoDate(),
    documentDateHijri: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateSettlementInput) => Promise<unknown> | unknown;
};

export function EmployeeSettlementCreateDialog({
  open,
  employee,
  saving = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const { data: activeCompany } = useActiveCompany();
  const [form, setForm] = React.useState<FormState>(defaultForm);

  React.useEffect(() => {
    if (open) setForm(defaultForm());
  }, [open]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const referenceNo = form.referenceNo.trim();
    if (!referenceNo || !form.documentDate) {
      toast.error('أكمل رقم المخالصة والتاريخ');
      return;
    }

    const result = await onSubmit({
      referenceNo,
      documentDate: form.documentDate,
      documentDateHijri: form.documentDateHijri.trim() || null,
      employeeName: employee.name?.trim() || '—',
      nationality: employee.nationality?.trim() || '—',
      nationalId: employee.nationalId?.trim() || '—',
      companyNameAr: activeCompany?.nameAr?.trim() || 'مؤسسة روز للتجارة',
    });

    if (result !== false && result !== null) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء مخالصة نهائية</DialogTitle>
          <DialogDescription>
            أدخل رقم المخالصة وتاريخ إنهاء الخدمة فقط — يُملأ تلقائياً على الـ PDF: الاسم، الجنسية، رقم
            الأحوال، والشركة من بيانات{' '}
            <span className="font-medium text-foreground">{employee.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="set-number">رقم المخالصة</Label>
              <Input
                id="set-number"
                dir="ltr"
                value={form.referenceNo}
                onChange={(e) => patch('referenceNo', e.target.value)}
                placeholder="SET-20260721-00001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-date">تاريخ المخالصة (ميلادي)</Label>
              <DatePickerInput
                id="set-date"
                value={form.documentDate}
                onChange={(v) => patch('documentDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-hijri">تاريخ المخالصة (هجري)</Label>
              <Input
                id="set-hijri"
                dir="ltr"
                value={form.documentDateHijri}
                onChange={(e) => patch('documentDateHijri', e.target.value)}
                placeholder="15/01/1446"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" variant="luxe" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'حفظ المخالصة'}
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

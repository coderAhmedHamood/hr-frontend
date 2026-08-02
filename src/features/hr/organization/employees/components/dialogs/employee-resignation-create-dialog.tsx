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
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { toast } from 'sonner';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { CreateEmployeeResignationDto } from '@/features/hr/organization/employees/lib/api/employee-resignations';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import { resignationAutoSnapshot } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';

const DEFAULT_REASONS =
  '1. ظروف شخصية\n2. فرصة عمل أخرى\n3. الانتقال لمدينة أخرى';

type FormState = {
  resignationNumber: string;
  submissionDate: string;
  effectiveDateGregorian: string;
  effectiveDateHijri: string;
  reasons: string;
};

function defaultDocNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `RES-${y}${m}${d}-${seq}`;
}

function defaultForm(): FormState {
  return {
    resignationNumber: defaultDocNumber(),
    submissionDate: todayIsoDate(),
    effectiveDateGregorian: todayIsoDate(),
    effectiveDateHijri: '',
    reasons: DEFAULT_REASONS,
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateEmployeeResignationDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeResignationCreateDialog({
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const resignationNumber = form.resignationNumber.trim();
    const reasons = form.reasons.trim();
    if (!resignationNumber || !form.submissionDate || !form.effectiveDateGregorian) {
      toast.error('أكمل رقم الاستقالة والتواريخ');
      return;
    }
    if (reasons.length < 3) {
      toast.error('أسباب الاستقالة مطلوبة');
      return;
    }

    const result = await onSubmit({
      resignationNumber,
      submissionDate: form.submissionDate,
      effectiveDateGregorian: form.effectiveDateGregorian,
      effectiveDateHijri: form.effectiveDateHijri.trim() || null,
      reasons,
      ...resignationAutoSnapshot({ employee, companyNameAr }),
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء طلب استقالة</DialogTitle>
          <DialogDescription>
            أدخل التواريخ والأسباب فقط — يُملأ تلقائياً على الـ PDF: الاسم، الفرع، الوظيفة، والجنسية من
            بيانات <span className="font-medium text-foreground">{employee.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-number">رقم الاستقالة</Label>
              <Input
                id="res-number"
                dir="ltr"
                value={form.resignationNumber}
                onChange={(e) => patch('resignationNumber', e.target.value)}
                placeholder="RES-20260721-00001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-submit">تاريخ التقديم</Label>
              <DatePickerInput
                id="res-submit"
                value={form.submissionDate}
                onChange={(v) => patch('submissionDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-effective">تاريخ السريان (ميلادي)</Label>
              <DatePickerInput
                id="res-effective"
                value={form.effectiveDateGregorian}
                onChange={(v) => patch('effectiveDateGregorian', v)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-hijri">تاريخ السريان (هجري)</Label>
              <Input
                id="res-hijri"
                dir="ltr"
                value={form.effectiveDateHijri}
                onChange={(e) => patch('effectiveDateHijri', e.target.value)}
                placeholder="15/01/1446"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-reasons">الأسباب</Label>
              <Textarea
                id="res-reasons"
                rows={4}
                dir="rtl"
                className="resize-y text-sm"
                value={form.reasons}
                onChange={(e) => patch('reasons', e.target.value)}
                required
                minLength={3}
              />
            </div>
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

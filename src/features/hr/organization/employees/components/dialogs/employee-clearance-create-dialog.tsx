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
import type { CreateEmployeeClearanceDto } from '@/features/hr/organization/employees/lib/api/employee-clearances';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import { clearanceAutoSnapshot } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';

const DEFAULT_REASONS =
  '• انتهاء عقد العمل\n• الرغبة الشخصية في الاستقالة\n• عدم وجود التزامات متبقية';

type FormState = {
  clearanceNumber: string;
  clearanceDate: string;
  reasons: string;
};

function defaultDocNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `CLR-${y}${m}${d}-${seq}`;
}

function defaultForm(): FormState {
  return {
    clearanceNumber: defaultDocNumber(),
    clearanceDate: todayIsoDate(),
    reasons: DEFAULT_REASONS,
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateEmployeeClearanceDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeClearanceCreateDialog({
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
    const clearanceNumber = form.clearanceNumber.trim();
    const jobTitle = employee.position?.trim() || 'موظف';
    const reasons = form.reasons.trim();
    if (!clearanceNumber || !form.clearanceDate) {
      toast.error('أكمل رقم الإخلاء والتاريخ');
      return;
    }
    if (reasons.length < 3) {
      toast.error('أسباب إخلاء الطرف مطلوبة');
      return;
    }

    const result = await onSubmit({
      clearanceNumber,
      clearanceDate: form.clearanceDate,
      jobTitle,
      reasons,
      financialDischargeAcknowledged: true,
      claimsWaived: true,
      noMutualObligations: true,
      ...clearanceAutoSnapshot({ employee, companyNameAr }),
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء إخلاء طرف</DialogTitle>
          <DialogDescription>
            أدخل رقم الإخلاء والتاريخ والأسباب فقط — يُملأ تلقائياً على الـ PDF: اسم الموظفة ورقم الهوية
            من بيانات <span className="font-medium text-foreground">{employee.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-number">رقم إخلاء الطرف</Label>
              <Input
                id="clr-number"
                dir="ltr"
                value={form.clearanceNumber}
                onChange={(e) => patch('clearanceNumber', e.target.value)}
                placeholder="CLR-20260721-00001"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-date">تاريخ الإخلاء</Label>
              <DatePickerInput
                id="clr-date"
                value={form.clearanceDate}
                onChange={(v) => patch('clearanceDate', v)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-reasons">الأسباب</Label>
              <Textarea
                id="clr-reasons"
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

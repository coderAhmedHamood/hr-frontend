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
import type { CreateExperienceCertificateDto } from '@/features/hr/organization/employees/lib/api/experience-certificates';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

/** API requires dutiesSummary — not printed on the Rose paper PDF. */
const DEFAULT_DUTIES =
  'أداء المهام الموكلة بكفاءة، والالتزام بسياسات العمل، والمساهمة في تحقيق أهداف القسم.';

type FormState = {
  certificateNumber: string;
  issuanceDate: string;
  serviceStartDate: string;
  serviceEndDate: string;
  jobTitleOnCertificate: string;
};

function defaultDocNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `EXP-${y}${m}${d}-${seq}`;
}

function defaultForm(employee: Employee): FormState {
  return {
    certificateNumber: defaultDocNumber(),
    issuanceDate: todayIsoDate(),
    serviceStartDate: employee.startDate || todayIsoDate(),
    serviceEndDate: employee.endDate || todayIsoDate(),
    jobTitleOnCertificate: employee.position || '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateExperienceCertificateDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeExperienceCertificateCreateDialog({
  open,
  employee,
  saving = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const [form, setForm] = React.useState<FormState>(() => defaultForm(employee));

  React.useEffect(() => {
    if (open) setForm(defaultForm(employee));
  }, [open, employee]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const certificateNumber = form.certificateNumber.trim();
    const jobTitleOnCertificate = form.jobTitleOnCertificate.trim() || employee.position?.trim() || 'موظف';
    if (
      !certificateNumber ||
      !form.issuanceDate ||
      !form.serviceStartDate ||
      !form.serviceEndDate
    ) {
      toast.error('أكمل رقم الشهادة وتواريخ الخدمة');
      return;
    }

    const result = await onSubmit({
      certificateNumber,
      issuanceDate: form.issuanceDate,
      serviceStartDate: form.serviceStartDate,
      serviceEndDate: form.serviceEndDate,
      jobTitleOnCertificate,
      dutiesSummary: DEFAULT_DUTIES,
      language: 'ar',
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء شهادة خبرة</DialogTitle>
          <DialogDescription>
            أدخل رقم الشهادة وتواريخ الخدمة والمسمى فقط — يُملأ تلقائياً على الـ PDF: اسم الموظف،
            الشركة، والقسم من بيانات{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
            {employee.departmentNameAr ? (
              <>
                {' '}
                (قسم <span className="font-medium text-foreground">{employee.departmentNameAr}</span>)
              </>
            ) : null}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-cert-no">رقم الشهادة</Label>
              <Input
                id="exp-cert-no"
                dir="ltr"
                value={form.certificateNumber}
                onChange={(e) => patch('certificateNumber', e.target.value)}
                placeholder="EXP-20260721-00001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-issue-date">تاريخ الإصدار</Label>
              <DatePickerInput
                id="exp-issue-date"
                value={form.issuanceDate}
                onChange={(v) => patch('issuanceDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-job-title">المسمى الوظيفي</Label>
              <Input
                id="exp-job-title"
                value={form.jobTitleOnCertificate}
                onChange={(e) => patch('jobTitleOnCertificate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-svc-start">بداية الخدمة</Label>
              <DatePickerInput
                id="exp-svc-start"
                value={form.serviceStartDate}
                onChange={(v) => patch('serviceStartDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-svc-end">نهاية الخدمة</Label>
              <DatePickerInput
                id="exp-svc-end"
                value={form.serviceEndDate}
                onChange={(v) => patch('serviceEndDate', v)}
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

'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { EmployeeAssignmentStatusDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
  EMPLOYEE_ASSIGNMENT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi, type JobTitleResponseDto } from '@/features/hr/organization/lib/api/jobTitles';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import type { EmployeeProfileAssignmentsModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';

type EditForm = {
  departmentId: string;
  jobTitleId: string;
  isPrimary: boolean;
  status: EmployeeAssignmentStatusDto;
  startDate: string;
  endDate: string;
};

type Props = {
  model: EmployeeProfileAssignmentsModel;
};

export function EmployeeAssignmentEditDialog({ model }: Props) {
  const {
    editAssignment,
    setEditAssignment,
    savingAssignment,
    submitAssignmentUpdate,
  } = model;

  const [form, setForm] = React.useState<EditForm>({
    departmentId: '',
    jobTitleId: '',
    isPrimary: false,
    status: 'active',
    startDate: '',
    endDate: '',
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitleResponseDto[]>([]);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const patch = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    if (!editAssignment) return;
    setForm({
      departmentId: editAssignment.departmentId ?? '',
      jobTitleId: editAssignment.jobTitleId ?? '',
      isPrimary: editAssignment.isPrimary,
      status: editAssignment.status,
      startDate: editAssignment.startDate?.slice(0, 10) ?? '',
      endDate: editAssignment.endDate?.slice(0, 10) ?? '',
    });
    setFormError(null);
    setLoadingRefs(true);
    void (async () => {
      try {
        const [dp, jt] = await Promise.all([
          departmentsApi.getAll({ companyId: editAssignment.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
          jobTitlesApi.getAll({ companyId: editAssignment.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
        ]);
        setDepartments(dp.items);
        setJobTitles(jt.items.filter((j) => j.isActive));
      } catch (e) {
        setFormError(handleApiError(e).displayMessage);
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, [editAssignment]);

  const filteredDepartments = React.useMemo(() => {
    if (!editAssignment?.branchId) return departments;
    return departments.filter((d) => d.branchId === editAssignment.branchId);
  }, [departments, editAssignment?.branchId]);

  const handleSubmit = async () => {
    if (!editAssignment) return;
    try {
      await submitAssignmentUpdate(editAssignment.id, {
        departmentId: form.departmentId || null,
        jobTitleId: form.jobTitleId || null,
        isPrimary: form.isPrimary,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
    } catch {
      // toast in hook
    }
  };

  return (
    <Dialog open={editAssignment != null} onOpenChange={(o) => !o && setEditAssignment(null)}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic-display">تعديل إسناد</DialogTitle>
          <DialogDescription>
            الشركة والفرع ثابتان بعد الإنشاء — يمكن تعديل القسم والمسمى والحالة والتواريخ فقط.
          </DialogDescription>
        </DialogHeader>

        {editAssignment ? (
          <div className="grid gap-4 py-2">
            {formError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-sm">
              <p><span className="text-muted-foreground">الشركة:</span> {editAssignment.companyNameAr}</p>
              <p><span className="text-muted-foreground">الفرع:</span> {editAssignment.branchNameAr}</p>
            </div>

            <div className="space-y-2">
              <Label>القسم</Label>
              <Select
                value={form.departmentId || 'none'}
                onValueChange={(v) => patch('departmentId', v === 'none' ? '' : v)}
                disabled={loadingRefs}
              >
                <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون قسم —</SelectItem>
                  {filteredDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nameAr ?? d.nameEn ?? d.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المسمى الوظيفي</Label>
              <Select
                value={form.jobTitleId || 'none'}
                onValueChange={(v) => patch('jobTitleId', v === 'none' ? '' : v)}
                disabled={loadingRefs}
              >
                <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون مسمى —</SelectItem>
                  {jobTitles.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.nameAr ?? j.nameEn ?? j.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => patch('status', v as EmployeeAssignmentStatusDto)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ASSIGNMENT_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{EMPLOYEE_ASSIGNMENT_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
                <Checkbox
                  checked={form.isPrimary}
                  onCheckedChange={(v) => patch('isPrimary', v === true)}
                />
                إسناد رئيسي
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <DatePickerInput value={form.startDate} onChange={(v) => patch('startDate', v)} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <DatePickerInput value={form.endDate} onChange={(v) => patch('endDate', v)} />
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            className="gap-2"
            disabled={savingAssignment || loadingRefs || !editAssignment}
            onClick={() => void handleSubmit()}
          >
            {savingAssignment ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            حفظ التعديل
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditAssignment(null)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

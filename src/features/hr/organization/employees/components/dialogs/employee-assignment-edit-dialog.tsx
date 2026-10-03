'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/shared/utils';
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
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { EmployeeAssignmentStatusDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
  EMPLOYEE_ASSIGNMENT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi, type JobTitleResponseDto } from '@/features/hr/organization/lib/api/jobTitles';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import type { EmployeeProfileAssignmentsModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';

type EditForm = {
  branchId: string;
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

  const containerRef = React.useRef<HTMLDivElement>(null);

  const [form, setForm] = React.useState<EditForm>({
    branchId: '',
    departmentId: '',
    jobTitleId: '',
    isPrimary: false,
    status: 'active',
    startDate: '',
    endDate: '',
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitleResponseDto[]>([]);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const patch = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    if (!editAssignment) return;
    setForm({
      branchId: editAssignment.branchId,
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
        const [br, dp, jt] = await Promise.all([
          branchesApi.getAll({ companyId: editAssignment.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
          departmentsApi.getAll({ companyId: editAssignment.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
          jobTitlesApi.getAll({ companyId: editAssignment.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
        ]);
        setBranches(br.items);
        setDepartments(dp.items);
        setJobTitles(jt.items.filter((j) => j.isActive));
      } catch (e) {
        setFormError(handleApiError(e).displayMessage);
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, [editAssignment]);

  const branchOptions = React.useMemo(() => {
    if (!editAssignment || branches.some((b) => b.id === editAssignment.branchId)) {
      return branches;
    }
    return [
      {
        id: editAssignment.branchId,
        companyId: editAssignment.companyId,
        code: '',
        nameAr: editAssignment.branchNameAr,
        nameEn: null,
        email: null,
        phone: null,
        mobile: null,
        city: null,
        district: null,
        address: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        managerName: null,
        isHeadquarters: false,
        isActive: true,
        notes: null,
        createdAt: '',
        updatedAt: '',
        createdBy: null,
        updatedBy: null,
      } satisfies BranchResponseDto,
      ...branches,
    ];
  }, [branches, editAssignment]);

  const filteredDepartments = React.useMemo(() => {
    if (!form.branchId) return departments;
    return departments.filter((d) => d.branchId === form.branchId);
  }, [departments, form.branchId]);

  const handleSubmit = async () => {
    if (!editAssignment) return;
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      setFormError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }
    if (form.status === 'ended' && !form.endDate) {
      setFormError('أدخل تاريخ النهاية عند إنهاء الإسناد');
      return;
    }
    if (!form.branchId) {
      setFormError('اختر الفرع');
      return;
    }
    try {
      await submitAssignmentUpdate(editAssignment.id, {
        branchId: form.branchId,
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
      <DialogContent ref={containerRef} className={cn(dialogShellContentClass, 'sm:max-w-lg')} dir="rtl">
        <DialogHeader className={dialogShellHeaderClass}>
          <DialogTitle className="font-arabic-display">تعديل إسناد</DialogTitle>
          <DialogDescription>
            الشركة ثابتة بعد الإنشاء — يمكن تعديل الفرع والقسم والمسمى والحالة والتواريخ.
          </DialogDescription>
        </DialogHeader>

        {editAssignment ? (
          <DialogBody className={cn(dialogShellBodyClass, 'grid gap-4')}>
            {formError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-sm">
              <p><span className="text-muted-foreground">الشركة:</span> {editAssignment.companyNameAr}</p>
            </div>

            <div className="space-y-2">
              <Label>الفرع</Label>
              <Select
                value={form.branchId}
                onValueChange={(v) => {
                  setForm((prev) => {
                    const stillValid = departments.some(
                      (d) => d.id === prev.departmentId && d.branchId === v,
                    );
                    return {
                      ...prev,
                      branchId: v,
                      departmentId: stillValid ? prev.departmentId : '',
                    };
                  });
                }}
                disabled={loadingRefs}
              >
                <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nameAr ?? b.nameEn ?? b.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  onValueChange={(v) => {
                    const status = v as EmployeeAssignmentStatusDto;
                    patch('status', status);
                    if (status === 'ended' && !form.endDate) {
                      patch('endDate', new Date().toISOString().slice(0, 10));
                    }
                  }}
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

            <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
              <p className="mb-3 text-xs font-semibold text-foreground">الفترة الزمنية</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <DatePickerInput
                    value={form.startDate}
                    onChange={(v) => patch('startDate', v)}
                    placeholder="اختر تاريخ البداية"
                    maxDate={form.endDate || undefined}
                    popoverContainer={containerRef.current}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <DatePickerInput
                  value={form.endDate}
                  onChange={(v) => patch('endDate', v)}
                  placeholder="اختياري — مفتوح"
                  minDate={form.startDate || undefined}
                  popoverContainer={containerRef.current}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    اتركه فارغاً إذا كان الإسناد مستمراً بدون تاريخ انتهاء.
                  </p>
                </div>
              </div>
            </div>
          </DialogBody>
        ) : null}

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            variant="luxe"
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
          <Button type="button" variant="outline" onClick={() => setEditAssignment(null)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

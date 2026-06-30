'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';
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
import type { CreateEmployeeAssignmentDto, EmployeeAssignmentStatusDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
  EMPLOYEE_ASSIGNMENT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { companiesApi, type CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi, type JobTitleResponseDto } from '@/features/hr/organization/lib/api/jobTitles';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getCompanyAccessLabel } from '@/features/auth/types/access-profile';
import type { EmployeeProfileAssignmentsModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';
import type { Employee } from '@/features/hr/organization/employees/types';

type AssignmentForm = {
  companyId: string;
  branchId: string;
  departmentId: string;
  jobTitleId: string;
  isPrimary: boolean;
  status: EmployeeAssignmentStatusDto;
  startDate: string;
  endDate: string;
};

const EMPTY_FORM: AssignmentForm = {
  companyId: '',
  branchId: '',
  departmentId: '',
  jobTitleId: '',
  isPrimary: false,
  status: 'active',
  startDate: '',
  endDate: '',
};

type Props = {
  employee: Employee;
  model: EmployeeProfileAssignmentsModel;
};

export function EmployeeAssignmentDialog({ employee, model }: Props) {
  const {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    savingAssignment,
    submitAssignment,
    assignmentCompanyContext,
  } = model;

  const defaultCompanyId = useDefaultCompanyId();
  const accessProfile = useAuthStore((s) => s.accessProfile);

  const [form, setForm] = React.useState<AssignmentForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitleResponseDto[]>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const companyOptions = React.useMemo(() => {
    const fromProfile = accessProfile?.companies ?? [];
    if (fromProfile.length > 0) {
      return fromProfile.map((c) => ({
        value: c.companyId,
        label: getCompanyAccessLabel(c),
      }));
    }
    return companies.map((c) => ({
      value: c.id,
      label: c.nameAr ?? c.nameEn ?? c.code ?? c.id.slice(0, 8),
    }));
  }, [accessProfile?.companies, companies]);

  const patch = <K extends keyof AssignmentForm>(key: K, value: AssignmentForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadScopedOptions = React.useCallback(async (companyId: string) => {
    const [br, dp, jt] = await Promise.all([
      branchesApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
      departmentsApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
      jobTitlesApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
    ]);
    setBranches(br.items);
    setDepartments(dp.items);
    setJobTitles(jt.items.filter((j) => j.isActive));
  }, []);

  React.useEffect(() => {
    if (!assignmentDialogOpen) return;
    if ((accessProfile?.companies.length ?? 0) > 0) return;
    setLoadingCompanies(true);
    void companiesApi
      .getAll({ limit: 200 })
      .then((res) => setCompanies(res.items))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false));
  }, [assignmentDialogOpen, accessProfile?.companies.length]);

  React.useEffect(() => {
    if (!assignmentDialogOpen) return;
    setFormError(null);
    setForm(EMPTY_FORM);
  }, [assignmentDialogOpen]);

  React.useEffect(() => {
    if (!assignmentDialogOpen) return;
    const initialCompanyId =
      assignmentCompanyContext?.companyId
      ?? defaultCompanyId
      ?? companyOptions.find((o) => o.value)?.value
      ?? '';
    if (!initialCompanyId) return;
    setForm((prev) => (prev.companyId ? prev : { ...prev, companyId: initialCompanyId }));
  }, [
    assignmentDialogOpen,
    assignmentCompanyContext?.companyId,
    defaultCompanyId,
    companyOptions,
  ]);

  React.useEffect(() => {
    if (!assignmentDialogOpen || !form.companyId) {
      setBranches([]);
      setDepartments([]);
      setJobTitles([]);
      return;
    }
    let cancelled = false;
    setLoadingRefs(true);
    void loadScopedOptions(form.companyId)
      .catch((e) => {
        if (!cancelled) setFormError(handleApiError(e).displayMessage);
      })
      .finally(() => {
        if (!cancelled) setLoadingRefs(false);
      });
    return () => { cancelled = true; };
  }, [assignmentDialogOpen, form.companyId, loadScopedOptions]);

  const handleCompanyChange = (companyId: string) => {
    setForm((prev) => ({
      ...prev,
      companyId,
      branchId: '',
      departmentId: '',
      jobTitleId: '',
    }));
  };

  const filteredDepartments = React.useMemo(() => {
    if (!form.branchId) return departments;
    return departments.filter((d) => d.branchId === form.branchId);
  }, [departments, form.branchId]);

  const validate = (): boolean => {
    if (!form.companyId) {
      setFormError('اختر الشركة');
      return false;
    }
    if (!form.branchId) {
      setFormError('اختر الفرع');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: CreateEmployeeAssignmentDto = {
      companyId: form.companyId,
      branchId: form.branchId,
      departmentId: form.departmentId || null,
      jobTitleId: form.jobTitleId || null,
      isPrimary: form.isPrimary,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    try {
      await submitAssignment(payload);
      setForm(EMPTY_FORM);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic-display">إسناد موظف</DialogTitle>
          <DialogDescription>
            ربط{' '}
            <span className="font-medium text-foreground">{employee?.name ?? '—'}</span>
            {' '}
            بشركة وفرع وقسم ومسمى وظيفي.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>الشركة *</Label>
            <Select
              value={form.companyId}
              onValueChange={handleCompanyChange}
              disabled={loadingCompanies || companyOptions.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
              <SelectContent>
                {companyOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {companyOptions.length === 0 && !loadingCompanies ? (
              <p className="text-[11px] text-muted-foreground">لا توجد شركات متاحة لحسابك.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>الفرع *</Label>
            <Select
              value={form.branchId}
              onValueChange={(v) => {
                patch('branchId', v);
                patch('departmentId', '');
              }}
              disabled={!form.companyId || loadingRefs}
            >
              <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
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
              disabled={!form.companyId || loadingRefs}
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
              disabled={!form.companyId || loadingRefs}
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
              <DatePickerInput
                value={form.startDate}
                onChange={(v) => patch('startDate', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ النهاية</Label>
              <DatePickerInput
                value={form.endDate}
                onChange={(v) => patch('endDate', v)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            className="gap-2"
            disabled={savingAssignment || loadingRefs || loadingCompanies || !form.companyId}
            onClick={() => void handleSubmit()}
          >
            {savingAssignment ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            حفظ الإسناد
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAssignmentDialogOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

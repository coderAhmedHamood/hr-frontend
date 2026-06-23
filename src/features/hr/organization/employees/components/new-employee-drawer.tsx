'use client';

import * as React from 'react';
import { User, Briefcase, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { companiesApi, type CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getCompanyAccessLabel } from '@/features/auth/types/access-profile';

interface NewEmployeeForm {
  companyId: string;
  nameAr: string;
  email: string; phone: string;
  nationalId: string; nationality: string;
  gender: string; birthDate: string; maritalStatus: string;
  position: string; departmentId: string; branchId: string; managerId: string;
  startDate: string;
  bankAccount: string; iban: string;
  address: string; emergencyContact: string;
  role: string;
}

const EMPTY_FORM: NewEmployeeForm = {
  companyId: '',
  nameAr: '', email: '', phone: '',
  nationalId: '', nationality: 'سعودي', gender: 'male', birthDate: '', maritalStatus: 'single',
  position: '', departmentId: '', branchId: '', managerId: 'none',
  startDate: '',
  bankAccount: '', iban: '',
  address: '', emergencyContact: '',
  role: 'employee',
};

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={cn('space-y-1.5', span2 && 'sm:col-span-2')}>
      <Label className="text-xs text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function NewEmployeeDrawer({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = React.useState<NewEmployeeForm>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof NewEmployeeForm, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const defaultCompanyId = useDefaultCompanyId();
  const accessProfile = useAuthStore((s) => s.accessProfile);

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

  React.useEffect(() => {
    if (!open) return;
    void (async () => {
      if ((accessProfile?.companies.length ?? 0) > 0) return;
      setLoadingCompanies(true);
      try {
        const res = await companiesApi.getAll({ limit: 200 });
        setCompanies(res.items);
      } catch {
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, [open, accessProfile?.companies.length]);

  React.useEffect(() => {
    if (!open) return;
    const initialCompanyId =
      defaultCompanyId
      ?? companyOptions.find((o) => o.value)?.value
      ?? '';
    setForm((f) => ({ ...f, companyId: f.companyId || initialCompanyId }));
  }, [open, defaultCompanyId, companyOptions]);

  React.useEffect(() => {
    if (!open || !form.companyId) {
      setBranches([]);
      setDepartments([]);
      return;
    }
    let cancelled = false;
    setLoadingRefs(true);
    void (async () => {
      try {
        const [br, dp] = await Promise.all([
          branchesApi.getAll({ companyId: form.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
          departmentsApi.getAll({ companyId: form.companyId, limit: 200, ...organizationActiveListStatusQuery() }),
        ]);
        if (!cancelled) {
          setBranches(br.items);
          setDepartments(dp.items);
        }
      } catch {
        if (!cancelled) {
          setBranches([]);
          setDepartments([]);
        }
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, form.companyId]);

  const handleCompanyChange = (companyId: string) => {
    setForm((f) => ({
      ...f,
      companyId,
      branchId: '',
      departmentId: '',
    }));
  };

  const patch = <K extends keyof NewEmployeeForm>(k: K, v: NewEmployeeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filteredDepartments = React.useMemo(() => {
    if (!form.branchId) return [];
    return departments.filter((d) => d.branchId === form.branchId);
  }, [departments, form.branchId]);

  const handleBranchChange = (branchId: string) => {
    setForm((f) => ({
      ...f,
      branchId,
      departmentId: f.departmentId && departments.some((d) => d.id === f.departmentId && d.branchId === branchId)
        ? f.departmentId
        : '',
    }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.companyId) e.companyId = 'مطلوب';
    if (!form.nameAr.trim()) e.nameAr = 'مطلوب';
    if (!form.startDate) e.startDate = 'مطلوب';
    if (!form.branchId) e.branchId = 'مطلوب';
    if (form.departmentId && !filteredDepartments.some((d) => d.id === form.departmentId)) {
      e.departmentId = 'القسم لا يتبع الفرع المختار';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!form.companyId) {
      setSaveError('اختر الشركة التي سيتبع لها الموظف.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await employeesApi.create({
        employeeCode: `EMP-${Date.now()}`,
        nameAr: form.nameAr.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        nationalId: form.nationalId.trim() || null,
        nationality: form.nationality.trim() || null,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        maritalStatus: form.maritalStatus || null,
        position: form.position.trim() || null,
        managerId: form.managerId !== 'none' ? form.managerId : null,
        startDate: form.startDate || null,
        bankAccount: form.bankAccount.trim() || null,
        iban: form.iban.trim() || null,
        address: form.address.trim() || null,
        emergencyContact: form.emergencyContact.trim() || null,
        role: form.role || null,
        companyId: form.companyId,
        branchId: form.branchId,
        departmentId: form.departmentId || null,
        assignmentIsPrimary: true,
      });

      toast.success('تم إضافة الموظف بنجاح');
      onCreated?.();
      onOpenChange(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.create');
      setSaveError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent ref={containerRef} className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">إضافة موظف جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموظف الجديد. الحقول المميزة بـ * إلزامية.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Personal info */}
          <div className="space-y-4">
            <SectionHeader icon={User} title="البيانات الشخصية" description="المعلومات الأساسية للموظف" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" required>
                <Input
                  value={form.nameAr}
                  onChange={(e) => patch('nameAr', e.target.value)}
                  className={cn(errors.nameAr && 'border-destructive')}
                  placeholder="عبدالرحمن المالكي"
                />
                {errors.nameAr && <p className="text-[11px] text-destructive">{errors.nameAr}</p>}
              </Field>
              <Field label="الجنس">
                <Select value={form.gender} onValueChange={(v) => patch('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="تاريخ الميلاد">
                <DatePickerInput
                  value={form.birthDate}
                  onChange={(v) => patch('birthDate', v)}
                  popoverContainer={containerRef.current}
                />
              </Field>
              <Field label="الجنسية">
                <Input value={form.nationality} onChange={(e) => patch('nationality', e.target.value)} placeholder="سعودي" />
              </Field>
              <Field label="الحالة الاجتماعية">
                <Select value={form.maritalStatus} onValueChange={(v) => patch('maritalStatus', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">أعزب</SelectItem>
                    <SelectItem value="married">متزوج</SelectItem>
                    <SelectItem value="divorced">مطلق</SelectItem>
                    <SelectItem value="widowed">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="رقم الهوية / الإقامة">
                <Input dir="ltr" value={form.nationalId} onChange={(e) => patch('nationalId', e.target.value)} placeholder="1098765432" />
              </Field>
              <Field label="العنوان">
                <Input value={form.address} onChange={(e) => patch('address', e.target.value)} placeholder="حي النخيل، الرياض" />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <SectionHeader icon={Phone} title="بيانات التواصل" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البريد الإلكتروني">
                <Input dir="ltr" type="email" value={form.email} onChange={(e) => patch('email', e.target.value)} placeholder="name@company.sa" />
              </Field>
              <Field label="رقم الجوال">
                <Input dir="ltr" value={form.phone} onChange={(e) => patch('phone', e.target.value)} placeholder="+966 50 123 4567" />
              </Field>
              <Field label="جهة اتصال الطوارئ">
                <Input dir="ltr" value={form.emergencyContact} onChange={(e) => patch('emergencyContact', e.target.value)} placeholder="+966 55 000 1111" />
              </Field>
              <Field label="رقم الحساب البنكي">
                <Input dir="ltr" value={form.bankAccount} onChange={(e) => patch('bankAccount', e.target.value)} placeholder="SA12 3400 5600 7800 9012" />
              </Field>
              <Field label="رقم الآيبان (IBAN)">
                <Input dir="ltr" value={form.iban} onChange={(e) => patch('iban', e.target.value)} placeholder="SA1234567890123456789012" />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Employment */}
          <div className="space-y-4">
            <SectionHeader icon={Briefcase} title="بيانات التوظيف" description="الشركة والمسمى الوظيفي والقسم والفرع" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الشركة" required span2={companyOptions.length > 1}>
                <Select
                  value={form.companyId || '_none'}
                  onValueChange={(v) => handleCompanyChange(v === '_none' ? '' : v)}
                  disabled={loadingCompanies || companyOptions.length <= 1}
                >
                  <SelectTrigger className={cn(errors.companyId && 'border-destructive')}>
                    <SelectValue placeholder={loadingCompanies ? 'جاري تحميل الشركات…' : 'اختر الشركة'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— اختر الشركة —</SelectItem>
                    {companyOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && <p className="text-[11px] text-destructive">{errors.companyId}</p>}
                {companyOptions.length <= 1 && form.companyId ? (
                  <p className="text-[10px] text-muted-foreground">شركة واحدة مرتبطة بحسابك — تم اختيارها تلقائياً.</p>
                ) : null}
              </Field>
              <Field label="المسمى الوظيفي" span2>
                <Input value={form.position} onChange={(e) => patch('position', e.target.value)} placeholder="مدير تطوير الأعمال" />
              </Field>
              <Field label="الفرع" required>
                <Select
                  value={form.branchId || '_none'}
                  onValueChange={(v) => handleBranchChange(v === '_none' ? '' : v)}
                  disabled={!form.companyId || loadingRefs}
                >
                  <SelectTrigger className={cn(errors.branchId && 'border-destructive')}>
                    <SelectValue placeholder={
                      !form.companyId
                        ? 'اختر الشركة أولاً'
                        : loadingRefs
                          ? 'جاري التحميل…'
                          : 'اختر الفرع'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— اختر الفرع —</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && <p className="text-[11px] text-destructive">{errors.branchId}</p>}
              </Field>
              <Field label="القسم">
                <Select
                  value={form.departmentId || '_none'}
                  onValueChange={(v) => patch('departmentId', v === '_none' ? '' : v)}
                  disabled={!form.branchId}
                >
                  <SelectTrigger className={cn(errors.departmentId && 'border-destructive')}>
                    <SelectValue placeholder={form.branchId ? 'اختر القسم' : 'اختر الفرع أولاً'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— بدون قسم —</SelectItem>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-[11px] text-destructive">{errors.departmentId}</p>}
              </Field>
              <Field label="تاريخ الالتحاق" required>
                <DatePickerInput
                  value={form.startDate}
                  onChange={(v) => patch('startDate', v)}
                  popoverContainer={containerRef.current}
                  className={cn(errors.startDate && 'border-destructive')}
                />
                {errors.startDate && <p className="text-[11px] text-destructive">{errors.startDate}</p>}
              </Field>
              <Field label="الدور في النظام">
                <Select value={form.role} onValueChange={(v) => patch('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="hr-manager">مدير موارد بشرية</SelectItem>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </div>
          )}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button variant="luxe" type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'إضافة الموظف'}
          </Button>
          <Button variant="outline" type="button" onClick={handleClose} disabled={saving}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

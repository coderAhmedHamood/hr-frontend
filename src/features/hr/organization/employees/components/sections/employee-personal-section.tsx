'use client';

import {
  User,
  Hash,
  UserRound,
  Heart,
  Calendar,
  Sparkles,
  Edit3,
  Check,
  X,
  Globe,
  Phone,
  MapPin,
  AtSign,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/shared/utils';
import { Prop, FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfileField, EmployeeProfileSelectField } from '@/features/hr/organization/employees/components/employee-profile-field';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeePersonalSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    branch,
    department,
    draft,
    editingPersonal,
    setEditingPersonal,
    saving,
    handleSavePersonal,
    handleCancelPersonal,
    updateField,
    yearsOfService,
    setCreateUserOpen,
  } = model;

  const showCreateUser = !employee.hasUser;

  return (
    <section>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft mb-8">
        <div className="absolute inset-0 bg-linear-to-bl from-primary/5 via-transparent to-gold/5" />
        <div className="absolute inset-0 dotted-bg opacity-[0.04]" />
        <div className="relative p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 min-w-0 flex-1">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-sm shrink-0">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="text-xl font-arabic-display bg-primary text-primary-foreground">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h1 className="font-arabic-display text-3xl font-semibold tracking-tight text-foreground">
                    {employee.name}
                  </h1>
                  <StatusBadge status={employee.contractStatus} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {employee.position}
                  <span className="text-muted-foreground/40 mx-2">·</span>
                  {department?.name}
                  <span className="text-muted-foreground/40 mx-2">·</span>
                  {branch?.name}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono">{employee.employeeCode}</span>
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    انضم في {formatDate(employee.startDate)}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1.5 text-gold">
                    <Sparkles className="h-3 w-3" />
                    {yearsOfService} سنة
                  </span>
                </div>
              </div>
            </div>
            {showCreateUser && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 text-xs shrink-0 self-start border-amber-300/60 text-amber-700 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                onClick={() => setCreateUserOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                إنشاء حساب مستخدم
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <h2 className="font-arabic-display text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-5 w-5 shrink-0 text-primary" />
            البيانات الشخصية
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">
            المعلومات الأساسية وبيانات الاتصال للموظف
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editingPersonal ? (
            <>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={handleCancelPersonal}>
                <X className="h-3.5 w-3.5" />
                إلغاء
              </Button>
              <Button size="sm" className="h-9 gap-1.5 text-xs" disabled={saving} onClick={() => void handleSavePersonal()}>
                <Check className="h-3.5 w-3.5" />
                {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
              </Button>
            </>
          ) : (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setEditingPersonal(true)}>
              <Edit3 className="h-3.5 w-3.5" />
              تعديل
            </Button>
          )}
        </div>
      </div>

      <FieldGroup title="الهوية">
        <Prop icon={Hash} label="رقم الموظف" mono>{draft.employeeCode}</Prop>
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={User} field="name" label="الاسم" />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Hash} field="nationalId" label="رقم الهوية" mono />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Globe} field="nationality" label="الجنسية" />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Calendar} field="birthDate" label="تاريخ الميلاد" type="date" format={(v) => formatDate(v as string)} />
        <EmployeeProfileSelectField
          draft={draft}
          editingPersonal={editingPersonal}
          updateField={updateField}
          icon={UserRound}
          field="gender"
          label="الجنس"
          options={[
            { value: 'male', label: 'ذكر' },
            { value: 'female', label: 'أنثى' },
          ]}
        />
        <EmployeeProfileSelectField
          draft={draft}
          editingPersonal={editingPersonal}
          updateField={updateField}
          icon={Heart}
          field="maritalStatus"
          label="الحالة الاجتماعية"
          options={[
            { value: 'single', label: 'أعزب' },
            { value: 'married', label: 'متزوج' },
          ]}
        />
      </FieldGroup>

      <FieldGroup title="بيانات الاتصال">
        <EmployeeProfileField
          draft={draft}
          editingPersonal={editingPersonal}
          updateField={updateField}
          editable
          icon={AtSign}
          field="email"
          label="البريد الإلكتروني"
          type="email"
          format={(v) => (
            <a href={`mailto:${v as string}`} className="hover:text-primary hover:underline underline-offset-4">
              {v as string}
            </a>
          )}
        />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Phone} field="phone" label="رقم الجوال" type="tel" mono />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={MapPin} field="address" label="العنوان" />
      </FieldGroup>
    </section>
  );
}

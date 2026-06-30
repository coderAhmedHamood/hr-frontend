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
} from 'lucide-react';
import { CreateUserAttentionButton } from '@/features/hr/organization/employees/components/create-user-attention-button';
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
      <div className="relative mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="absolute inset-0 bg-linear-to-bl from-primary/5 via-transparent to-gold/5" />
        <div className="absolute inset-0 dotted-bg opacity-[0.04]" />
        <div className="relative p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-background sm:h-12 sm:w-12">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-primary font-arabic-display text-sm text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="min-w-0 truncate font-arabic-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {employee.name}
                </h1>
                <StatusBadge
                  status={employee.contractStatus}
                  className="h-5 shrink-0 gap-0.5 px-1.5 py-0 text-[10px] leading-none [&_svg]:h-2.5 [&_svg]:w-2.5"
                />
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {employee.position}
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                {department?.name}
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                {branch?.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" />
                  <span className="font-mono">{employee.employeeCode}</span>
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  انضم في {formatDate(employee.startDate)}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="inline-flex items-center gap-1 text-gold">
                  <Sparkles className="h-2.5 w-2.5" />
                  {yearsOfService} سنة
                </span>
              </div>
              {showCreateUser ? (
                <CreateUserAttentionButton
                  className="mt-2 sm:mt-1.5"
                  onClick={() => setCreateUserOpen(true)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="font-arabic-display text-sm font-semibold tracking-tight text-foreground sm:text-base">
              البيانات الشخصية
            </h2>
            <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
              المعلومات الأساسية وبيانات الاتصال للموظف
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {editingPersonal ? (
            <>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={handleCancelPersonal}>
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">إلغاء</span>
              </Button>
              <Button size="sm" className="h-8 gap-1 px-2.5 text-xs" disabled={saving} onClick={() => void handleSavePersonal()}>
                <Check className="h-3.5 w-3.5" />
                {saving ? '…' : 'حفظ'}
              </Button>
            </>
          ) : (
            <Button size="sm" className="h-8 gap-1 px-2.5 text-xs" onClick={() => setEditingPersonal(true)}>
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

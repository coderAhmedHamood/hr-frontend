'use client';

import { CreditCard, Wallet } from 'lucide-react';
import { formatCurrency } from '@/shared/utils';
import { FieldGroup, SectionH } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfileField } from '@/features/hr/organization/employees/components/employee-profile-field';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeFinancialSection({ model }: { model: EmployeeProfileModel }) {
  const { draft, updateField, netSalary, totalSalary } = model;

  return (
    <section>
      <SectionH icon={CreditCard} title="البيانات المالية" subtitle="الراتب والبدلات والحساب البنكي" />

      <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-soft mb-8">
        <div className="absolute inset-0 bg-linear-to-bl from-gold/8 via-transparent to-primary/5" />
        <div className="relative p-6">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              الراتب الصافي الشهري
            </span>
            <Wallet className="h-4 w-4 text-gold" />
          </div>
          <div className="font-arabic-display text-4xl font-semibold tabular-nums text-gold mb-4">
            {formatCurrency(netSalary)}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              إجمالي:
              {' '}
              <span className="font-arabic-display font-semibold text-foreground tabular-nums">{formatCurrency(totalSalary)}</span>
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span>
              خصومات:
              {' '}
              <span className="font-arabic-display font-semibold text-destructive tabular-nums">−{formatCurrency(draft.gosi)}</span>
            </span>
          </div>
        </div>
      </div>

      <FieldGroup title="مكوّنات الراتب">
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Wallet} field="baseSalary" label="الراتب الأساسي" type="number" format={(v) => formatCurrency(v as number)} />
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Wallet} field="housingAllowance" label="بدل السكن" type="number" format={(v) => formatCurrency(v as number)} />
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Wallet} field="transportAllowance" label="بدل المواصلات" type="number" format={(v) => formatCurrency(v as number)} />
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Wallet} field="otherAllowances" label="بدلات أخرى" type="number" format={(v) => formatCurrency(v as number)} />
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Wallet} field="gosi" label="التأمينات (GOSI)" type="number" accent="destructive" format={(v) => `−${formatCurrency(v as number)}`} />
      </FieldGroup>

      <FieldGroup title="الحساب البنكي">
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={CreditCard} field="bankAccount" label="رقم الحساب" mono />
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={CreditCard} field="iban" label="رقم الآيبان (IBAN)" mono />
      </FieldGroup>
    </section>
  );
}

'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { cn } from '@/shared/utils';
import { Prop } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerInput } from '@/components/ui/date-picker-input';

export type EmployeeProfileDraft = Employee;

type FieldProps<K extends keyof EmployeeProfileDraft> = {
  field: K;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  mono?: boolean;
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
  format?: (v: EmployeeProfileDraft[K]) => React.ReactNode;
  icon: React.ElementType;
  label: string;
  editable?: boolean;
  draft: EmployeeProfileDraft;
  editingPersonal: boolean;
  updateField: <Key extends keyof EmployeeProfileDraft>(key: Key, value: EmployeeProfileDraft[Key]) => void;
};

function ProfileFieldShell({
  icon: Icon,
  label,
  children,
  editing = false,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  editing?: boolean;
}) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-soft transition-all',
        editing
          ? 'border-primary/30 ring-1 ring-primary/10 hover:border-primary/40'
          : 'border-border hover:border-primary/20 hover:shadow-elevated',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
            editing ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary group-hover:bg-primary/15',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <label className="text-[11px] font-medium text-muted-foreground truncate">{label}</label>
      </div>
      {children}
    </div>
  );
}

export function EmployeeProfileSelectField<K extends keyof EmployeeProfileDraft>({
  field,
  icon,
  label,
  options,
  draft,
  editingPersonal,
  updateField,
}: {
  field: K;
  icon: React.ElementType;
  label: string;
  options: { value: string; label: string }[];
  draft: EmployeeProfileDraft;
  editingPersonal: boolean;
  updateField: <Key extends keyof EmployeeProfileDraft>(key: Key, value: EmployeeProfileDraft[Key]) => void;
}) {
  const value = draft[field];
  const display = options.find((o) => o.value === String(value))?.label ?? String(value ?? '');

  if (!editingPersonal) {
    return <Prop icon={icon} label={label}>{display}</Prop>;
  }

  const selectId = `emp-field-${String(field)}`;

  return (
    <ProfileFieldShell icon={icon} label={label} editing>
      <Select
        value={String(value ?? '')}
        onValueChange={(v) => updateField(field, v as EmployeeProfileDraft[K])}
      >
        <SelectTrigger
          id={selectId}
          className="h-10 w-full rounded-lg border-border bg-muted/50 text-sm font-medium shadow-none focus:ring-primary/20"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-sm">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ProfileFieldShell>
  );
}

export function EmployeeProfileField<K extends keyof EmployeeProfileDraft>({
  field,
  type = 'text',
  mono,
  accent,
  format,
  icon,
  label,
  editable = false,
  draft,
  editingPersonal,
  updateField,
}: FieldProps<K>) {
  const value = draft[field];
  const display: React.ReactNode = format ? format(value) : (value as React.ReactNode);

  if (!editable || !editingPersonal) {
    return <Prop icon={icon} label={label} mono={mono} accent={accent}>{display}</Prop>;
  }

  const inputId = `emp-field-${String(field)}`;

  if (type === 'date') {
    return (
      <ProfileFieldShell icon={icon} label={label} editing>
        <DatePickerInput
          id={inputId}
          value={String(value ?? '')}
          onChange={(v) => updateField(field, v as EmployeeProfileDraft[K])}
          className="h-10 rounded-lg border-border bg-muted/50 font-medium shadow-none"
        />
      </ProfileFieldShell>
    );
  }

  return (
    <ProfileFieldShell icon={icon} label={label} editing>
      <input
        id={inputId}
        type={type}
        value={String(value ?? '')}
        onChange={(e) => {
          const v = type === 'number' ? Number(e.target.value) : e.target.value;
          updateField(field, v as EmployeeProfileDraft[K]);
        }}
        dir={mono ? 'ltr' : undefined}
        className={cn(
          'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors',
          mono && 'font-mono text-xs tracking-wide',
        )}
      />
    </ProfileFieldShell>
  );
}

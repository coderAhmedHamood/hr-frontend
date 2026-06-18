'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';
import { dialogFormFooterClass } from '@/components/ui/dialog';
import { ROSE_MERGE_FIELD_CATALOG } from '@/features/hr/organization/employees/lib/rose-document-templates/merge-field-catalog';
import { resolveRoseMergeValue } from '@/features/hr/organization/employees/lib/rose-document-templates/resolve-merge-context';
import type {
  RoseDocumentLanguage,
  RoseMergeFieldKey,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export const ROSE_LANGUAGE_OPTIONS: { value: RoseDocumentLanguage; label: string }[] = [
  { value: 'ar', label: 'عربي' },
  { value: 'en', label: 'English' },
  { value: 'bilingual', label: 'ثنائي' },
];

/** Flex shell so header/footer stay visible while body scrolls. */
export const rosePrepDialogContentClass =
  'top-[5vh] flex max-h-[90vh] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden border-border p-0';
export const rosePrepDialogHeaderClass =
  'shrink-0 border-b border-border px-5 py-4 text-right';
export const rosePrepDialogBodyClass =
  'min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5 text-right';
export const rosePrepDialogFooterClass = cn(
  dialogFormFooterClass,
  'shrink-0 px-5 py-4',
);

type EmployeeFieldsProps = {
  fieldVisibility: Partial<Record<RoseMergeFieldKey, boolean>>;
  fieldOverrides: Partial<Record<RoseMergeFieldKey, string>>;
  mergePreviewCtx: Parameters<typeof resolveRoseMergeValue>[1];
  onVisibilityChange: (key: RoseMergeFieldKey, visible: boolean) => void;
  onOverrideChange: (key: RoseMergeFieldKey, value: string) => void;
  visibleFieldKeys?: RoseMergeFieldKey[];
};

export function RoseDocumentLanguagePicker({
  value,
  onChange,
}: {
  value: RoseDocumentLanguage;
  onChange: (value: RoseDocumentLanguage) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROSE_LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted/40',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RoseDocumentEmployeeFieldsPanel({
  fieldVisibility,
  fieldOverrides,
  mergePreviewCtx,
  onVisibilityChange,
  onOverrideChange,
  visibleFieldKeys,
}: EmployeeFieldsProps) {
  const employeeFields = ROSE_MERGE_FIELD_CATALOG.filter((f) => {
    if (f.group !== 'employee') return false;
    if (!visibleFieldKeys) return true;
    return visibleFieldKeys.includes(f.key);
  });

  if (employeeFields.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="mb-3 text-xs font-semibold text-foreground">بيانات الموظف في النموذج</p>
      <div className="space-y-2">
        {employeeFields.map((field) => {
          const visible = fieldVisibility[field.key] ?? false;
          const resolved = resolveRoseMergeValue(field.key, mergePreviewCtx);
          const currentValue = fieldOverrides[field.key] ?? resolved.ar;
          return (
            <div
              key={field.key}
              className={cn(
                'grid gap-2 rounded-lg border border-border/50 bg-card p-2.5 sm:grid-cols-[auto_1fr_1fr]',
                !visible && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={visible}
                  onCheckedChange={(v) => onVisibilityChange(field.key, v)}
                  aria-label={field.labelAr}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium">{field.labelAr}</p>
                <p className="text-[10px] text-muted-foreground" dir="ltr">{field.labelEn}</p>
              </div>
              <Input
                value={currentValue}
                onChange={(e) => onOverrideChange(field.key, e.target.value)}
                disabled={!visible}
                className="h-8 text-xs"
                dir={field.key === 'employee.nameEn' || field.key === 'employee.email' ? 'ltr' : 'rtl'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function useRoseMergePreviewCtx(
  employee: Employee,
  branchNameAr: string,
  departmentNameAr: string,
  companyNameAr: string,
  companyNameEn: string,
  dates: {
    footerDateIso: string;
    absenceStartIso?: string;
    endDateIso?: string;
    serviceStartIso?: string;
    certificateDateIso?: string;
  },
) {
  return React.useMemo(() => ({
    employee,
    branchNameAr,
    departmentNameAr,
    companyNameAr,
    companyNameEn,
    absenceStartHijri: '—',
    absenceStartGregorian: dates.absenceStartIso ?? dates.footerDateIso,
    footerDateGregorian: dates.footerDateIso,
    endDateHijri: '—',
    endDateGregorian: dates.endDateIso ?? dates.footerDateIso,
    serviceStartHijri: '—',
    serviceStartGregorian: dates.serviceStartIso ?? employee.startDate ?? dates.footerDateIso,
    certificateDateGregorian: dates.certificateDateIso ?? dates.footerDateIso,
    addressedToAr: '',
    addressedToEn: '',
    clearanceReasonAr: '',
    clearanceReasonEn: '',
  }), [employee, branchNameAr, departmentNameAr, companyNameAr, companyNameEn, dates]);
}

'use client';

import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { FormField, MinimalDropdown, SearchableDropdown } from '@/components/ui/shared-dialogs';
import {
  INVESTIGATION_DEDUCTION_TYPE_OPTIONS,
  INVESTIGATION_RECOMMENDATION_OPTIONS,
  INVESTIGATION_RESULT_SUBMIT_OPTIONS,
  type InvestigationRecommendationFilter,
  type InvestigationResultsDraftForm,
} from '@/features/hr/discipline/investigations/constants/investigation-form';

type InvestigatorOption = { value: string; label: string };

type InvestigationResultsFormFieldsProps = {
  draft: InvestigationResultsDraftForm;
  onChange: (patch: Partial<InvestigationResultsDraftForm>) => void;
  investigatorOptions: InvestigatorOption[];
  showInvestigationDate?: boolean;
  investigationDateReadOnly?: boolean;
};

export function InvestigationResultsFormFields({
  draft,
  onChange,
  investigatorOptions,
  showInvestigationDate = true,
  investigationDateReadOnly = false,
}: InvestigationResultsFormFieldsProps) {
  return (
    <>
      {showInvestigationDate ? (
        <FormField label="تاريخ التحقيق" required>
          {investigationDateReadOnly ? (
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm font-mono tabular-nums" dir="ltr">
              {draft.investigationDate || '—'}
            </div>
          ) : (
            <DatePickerInput
              value={draft.investigationDate}
              onChange={(ymd) => onChange({ investigationDate: ymd })}
            />
          )}
        </FormField>
      ) : null}
      <FormField label="المحقق" required>
        <SearchableDropdown
          value={draft.investigatorEmployeeId}
          onChange={(v) => onChange({ investigatorEmployeeId: v })}
          options={investigatorOptions}
          placeholder="اختر المحقق…"
        />
      </FormField>
      <FormField label="أقوال الموظف">
        <textarea
          value={draft.employeeStatement}
          onChange={(e) => onChange({ employeeStatement: e.target.value })}
          placeholder="ما قاله الموظف في التحقيق…"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </FormField>
      <FormField label="أقوال الشهود">
        <textarea
          value={draft.witnessStatement}
          onChange={(e) => onChange({ witnessStatement: e.target.value })}
          placeholder="شهادة الشهود…"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </FormField>
      <FormField label="نتيجة التحقيق" required>
        <MinimalDropdown
          value={draft.result}
          onChange={(v) => onChange({ result: v as InvestigationResultsDraftForm['result'] })}
          options={INVESTIGATION_RESULT_SUBMIT_OPTIONS}
        />
      </FormField>
      <FormField label="التوصية">
        <MinimalDropdown
          value={draft.recommendationType}
          onChange={(v) => {
            const next = v as InvestigationRecommendationFilter;
            onChange({
              recommendationType: next,
              deductionValue: next === 'deduction' ? draft.deductionValue : '',
            });
          }}
          options={INVESTIGATION_RECOMMENDATION_OPTIONS}
        />
      </FormField>
      {draft.recommendationType === 'deduction' ? (
        <>
          <FormField label="نوع الاستقطاع" required>
            <MinimalDropdown
              value={draft.deductionType}
              onChange={(v) => onChange({ deductionType: v as InvestigationResultsDraftForm['deductionType'] })}
              options={INVESTIGATION_DEDUCTION_TYPE_OPTIONS}
            />
          </FormField>
          <FormField label="قيمة الاستقطاع" required>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.deductionValue}
              onChange={(e) => onChange({ deductionValue: e.target.value })}
              placeholder="أدخل القيمة…"
            />
          </FormField>
        </>
      ) : null}
      {draft.recommendationType === 'warning' ? (
        <p className="text-xs text-muted-foreground">
          عند اختيار «توجيه إنذار» يُنشئ النظام إنذاراً تلقائياً للموظف.
        </p>
      ) : null}
    </>
  );
}

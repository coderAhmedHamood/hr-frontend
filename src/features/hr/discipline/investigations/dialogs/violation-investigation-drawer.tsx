'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { HRSettingsFormDrawer } from '@/components/ui/shared-dialogs';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { ViolationInvestigationDto } from '@/features/hr/discipline/lib/api/violation-records';
import { InvestigationResultsFormFields } from '@/features/hr/discipline/investigations/components/investigation-results-form-fields';
import {
  INVESTIGATION_RESULTS_EMPTY,
  type InvestigationResultsDraftForm,
} from '@/features/hr/discipline/investigations/constants/investigation-form';
import {
  submitInvestigationForViolationRecord,
  validateInvestigationResultsDraft,
} from '@/features/hr/discipline/investigations/services/submit-violation-investigation';

export type ViolationInvestigationContext = {
  id: string;
  caseNumber: string;
  employeeNameAr: string;
  date: string;
  investigations: ViolationInvestigationDto[];
};

type ViolationInvestigationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violationCase: ViolationInvestigationContext | null;
  companyId: string;
  employees: { id: string; nameAr: string }[];
  onSuccess?: () => void;
};

function findPendingInvestigation(investigations: ViolationInvestigationDto[]) {
  return investigations.find((inv) => inv.result === 'pending') ?? null;
}

export function ViolationInvestigationDrawer({
  open,
  onOpenChange,
  violationCase,
  companyId,
  employees,
  onSuccess,
}: ViolationInvestigationDrawerProps) {
  const [draft, setDraft] = React.useState<InvestigationResultsDraftForm>(INVESTIGATION_RESULTS_EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const pendingInvestigation = violationCase
    ? findPendingInvestigation(violationCase.investigations)
    : null;

  React.useEffect(() => {
    if (!open || !violationCase) return;
    const pending = findPendingInvestigation(violationCase.investigations);
    setDraft({
      investigationDate: pending?.investigationDate ?? violationCase.date,
      investigatorEmployeeId: pending?.investigatorEmployeeId ?? '',
      employeeStatement: pending?.employeeStatement ?? '',
      witnessStatement: pending?.witnessStatement ?? '',
      result: 'proven',
      recommendationType: 'all',
      deductionType: 'days',
      deductionValue: '',
    });
    setFormError(null);
  }, [open, violationCase]);

  const investigatorOptions = React.useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.nameAr })),
    [employees],
  );

  const set = (patch: Partial<InvestigationResultsDraftForm>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    if (!violationCase || !companyId) {
      setFormError('تعذر تحديد المخالفة أو الشركة');
      return;
    }

    const validationError = validateInvestigationResultsDraft(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await submitInvestigationForViolationRecord({
        companyId,
        violationRecordId: violationCase.id,
        pendingInvestigationId: pendingInvestigation?.id ?? null,
        draft,
      });
      toast.success(
        pendingInvestigation
          ? 'تم إدخال نتائج التحقيق'
          : 'تم فتح التحقيق وإدخال النتائج',
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.violation-submit');
      setFormError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const title = violationCase
    ? pendingInvestigation
      ? `إدخال نتائج التحقيق — ${violationCase.caseNumber}`
      : `فتح تحقيق — ${violationCase.caseNumber}`
    : 'التحقيق';

  return (
    <HRSettingsFormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      onSave={() => void handleSave()}
      saveDisabled={saving}
      error={formError}
    >
      {violationCase ? (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">الموظف: </span>
            {violationCase.employeeNameAr ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">المخالفة: </span>
            <span className="font-mono tabular-nums" dir="ltr">{violationCase.caseNumber}</span>
          </p>
          {pendingInvestigation ? (
            <p className="text-xs text-muted-foreground">
              يوجد تحقيق مبدئي «قيد التحقيق» — أدخل النتائج والتوصية لإغلاقه.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              سيتم فتح تحقيق جديد وإرسال النتائج في خطوة واحدة.
            </p>
          )}
        </div>
      ) : null}
      <InvestigationResultsFormFields
        draft={draft}
        onChange={set}
        investigatorOptions={investigatorOptions}
        showInvestigationDate
        investigationDateReadOnly={Boolean(pendingInvestigation)}
      />
    </HRSettingsFormDrawer>
  );
}

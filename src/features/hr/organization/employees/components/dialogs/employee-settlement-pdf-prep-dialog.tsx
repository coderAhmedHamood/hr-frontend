'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import {
  RoseDocumentEmployeeFieldsPanel,
  RoseDocumentLanguagePicker,
  rosePrepDialogBodyClass,
  rosePrepDialogContentClass,
  rosePrepDialogFooterClass,
  rosePrepDialogHeaderClass,
  useRoseMergePreviewCtx,
} from '@/features/hr/organization/employees/components/dialogs/rose-document-prep-shared';
import { createDefaultSettlementWizard } from '@/features/hr/organization/employees/lib/rose-document-templates/build-settlement-print-model';
import { useRoseSettlementTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/settlement-template-store';
import type {
  RoseMergeFieldKey,
  SettlementWizardPayload,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

type Props = {
  open: boolean;
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  onCancel: () => void;
  onApply: (wizard: SettlementWizardPayload) => void;
  onOpenTemplateSettings: () => void;
};

export function EmployeeSettlementPdfPrepDialog({
  open,
  employee,
  branchNameAr,
  departmentNameAr,
  companyNameAr,
  companyNameEn,
  onCancel,
  onApply,
  onOpenTemplateSettings,
}: Props) {
  const template = useRoseSettlementTemplateStore((s) => s.template);
  const [wizard, setWizard] = React.useState<SettlementWizardPayload>(() =>
    createDefaultSettlementWizard(employee, template),
  );

  React.useEffect(() => {
    if (!open) return;
    setWizard(createDefaultSettlementWizard(employee, template));
  }, [open, employee, template]);

  const mergePreviewCtx = useRoseMergePreviewCtx(
    employee, branchNameAr, departmentNameAr, companyNameAr, companyNameEn,
    {
      footerDateIso: wizard.footerDateIso,
      endDateIso: wizard.endDateIso,
      serviceStartIso: wizard.serviceStartIso,
    },
  );

  const patchWizard = <K extends keyof SettlementWizardPayload>(key: K, value: SettlementWizardPayload[K]) =>
    setWizard((w) => ({ ...w, [key]: value }));

  const setFieldVisible = (key: RoseMergeFieldKey, visible: boolean) =>
    setWizard((w) => ({ ...w, fieldVisibility: { ...w.fieldVisibility, [key]: visible } }));

  const setFieldOverride = (key: RoseMergeFieldKey, value: string) =>
    setWizard((w) => ({ ...w, fieldOverrides: { ...w.fieldOverrides, [key]: value } }));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className={rosePrepDialogContentClass}>
        <DialogHeader className={rosePrepDialogHeaderClass}>
          <DialogTitle className="font-display">بيانات المخالصة النهائية</DialogTitle>
          <DialogDescription className="sr-only">تخصيص النموذج ثم إنشاء المعاينة</DialogDescription>
          <p className="text-xs text-muted-foreground">
            الموظف: <span className="font-medium text-foreground">{employee.name}</span>
          </p>
        </DialogHeader>

        <div className={rosePrepDialogBodyClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RoseDocumentLanguagePicker value={wizard.language} onChange={(v) => patchWizard('language', v)} />
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenTemplateSettings}>
              إعدادات القالب
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="set-end">تاريخ إنهاء الخدمة</Label>
              <DatePickerInput
                id="set-end"
                value={wizard.endDateIso}
                onChange={(v) => patchWizard('endDateIso', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-start">تاريخ بداية الخدمة</Label>
              <DatePickerInput
                id="set-start"
                value={wizard.serviceStartIso}
                onChange={(v) => patchWizard('serviceStartIso', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-foot-date">تاريخ التذييل</Label>
              <DatePickerInput
                id="set-foot-date"
                value={wizard.footerDateIso}
                onChange={(v) => patchWizard('footerDateIso', v)}
              />
            </div>
          </div>

          <RoseDocumentEmployeeFieldsPanel
            fieldVisibility={wizard.fieldVisibility}
            fieldOverrides={wizard.fieldOverrides}
            mergePreviewCtx={mergePreviewCtx}
            onVisibilityChange={setFieldVisible}
            onOverrideChange={setFieldOverride}
            visibleFieldKeys={template.fieldSlots.map((s) => s.fieldKey)}
          />
        </div>

        <DialogFooter className={rosePrepDialogFooterClass}>
          <Button type="button" variant="luxe" onClick={() => onApply(wizard)}>إنشاء معاينة PDF</Button>
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

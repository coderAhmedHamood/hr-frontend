'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  RoseDocumentEmployeeFieldsPanel,
  RoseDocumentLanguagePicker,
  rosePrepDialogBodyClass,
  rosePrepDialogContentClass,
  rosePrepDialogFooterClass,
  rosePrepDialogHeaderClass,
  useRoseMergePreviewCtx,
} from '@/features/hr/organization/employees/components/dialogs/rose-document-prep-shared';
import { createDefaultClearanceWizard } from '@/features/hr/organization/employees/lib/rose-document-templates/build-clearance-print-model';
import { useRoseClearanceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/clearance-template-store';
import type {
  ClearanceWizardPayload,
  RoseMergeFieldKey,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

type Props = {
  open: boolean;
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  onCancel: () => void;
  onApply: (wizard: ClearanceWizardPayload) => void;
  onOpenTemplateSettings: () => void;
};

export function EmployeeClearancePdfPrepDialog({
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
  const template = useRoseClearanceTemplateStore((s) => s.template);
  const [wizard, setWizard] = React.useState<ClearanceWizardPayload>(() =>
    createDefaultClearanceWizard(employee, template),
  );

  React.useEffect(() => {
    if (!open) return;
    setWizard(createDefaultClearanceWizard(employee, template));
  }, [open, employee, template]);

  const mergePreviewCtx = useRoseMergePreviewCtx(
    employee, branchNameAr, departmentNameAr, companyNameAr, companyNameEn,
    { footerDateIso: wizard.footerDateIso },
  );

  const patchWizard = <K extends keyof ClearanceWizardPayload>(key: K, value: ClearanceWizardPayload[K]) =>
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
          <DialogTitle className="font-display">بيانات نموذج إخلاء الطرف</DialogTitle>
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-reason-ar">سبب إخلاء الطرف (عربي)</Label>
              <Textarea
                id="clr-reason-ar"
                value={wizard.reasonTextAr}
                onChange={(e) => patchWizard('reasonTextAr', e.target.value)}
                rows={3}
                className="resize-y text-right text-sm"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-reason-en">Reason for clearance (English)</Label>
              <Textarea
                id="clr-reason-en"
                value={wizard.reasonTextEn}
                onChange={(e) => patchWizard('reasonTextEn', e.target.value)}
                rows={3}
                className="resize-y text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clr-foot-date">تاريخ التذييل</Label>
              <Input
                id="clr-foot-date"
                type="date"
                value={wizard.footerDateIso}
                onChange={(e) => patchWizard('footerDateIso', e.target.value)}
                className="font-mono"
                dir="ltr"
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

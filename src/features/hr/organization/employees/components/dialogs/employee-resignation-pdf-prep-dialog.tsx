'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createDefaultResignationWizard,
} from '@/features/hr/organization/employees/lib/rose-document-templates/build-resignation-print-model';
import {
  RoseDocumentEmployeeFieldsPanel,
  RoseDocumentLanguagePicker,
  rosePrepDialogBodyClass,
  rosePrepDialogContentClass,
  rosePrepDialogFooterClass,
  rosePrepDialogHeaderClass,
  useRoseMergePreviewCtx,
} from '@/features/hr/organization/employees/components/dialogs/rose-document-prep-shared';
import { useRoseResignationTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/resignation-template-store';
import type {
  ResignationWizardPayload,
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
  onApply: (wizard: ResignationWizardPayload) => void;
  onOpenTemplateSettings: () => void;
};

export function EmployeeResignationPdfPrepDialog({
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
  const template = useRoseResignationTemplateStore((s) => s.template);
  const [wizard, setWizard] = React.useState<ResignationWizardPayload>(() =>
    createDefaultResignationWizard(employee, companyNameAr, template),
  );

  React.useEffect(() => {
    if (!open) return;
    setWizard(createDefaultResignationWizard(employee, companyNameAr, template));
  }, [open, employee, companyNameAr, template]);

  const mergePreviewCtx = useRoseMergePreviewCtx(
    employee, branchNameAr, departmentNameAr, companyNameAr, companyNameEn,
    { footerDateIso: wizard.footerDateIso, absenceStartIso: wizard.absenceStartIso },
  );

  const patchWizard = <K extends keyof ResignationWizardPayload>(key: K, value: ResignationWizardPayload[K]) =>
    setWizard((w) => ({ ...w, [key]: value }));

  const setFieldVisible = (key: RoseMergeFieldKey, visible: boolean) =>
    setWizard((w) => ({
      ...w,
      fieldVisibility: { ...w.fieldVisibility, [key]: visible },
    }));

  const setFieldOverride = (key: RoseMergeFieldKey, value: string) =>
    setWizard((w) => ({
      ...w,
      fieldOverrides: { ...w.fieldOverrides, [key]: value },
    }));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className={rosePrepDialogContentClass}>
        <DialogHeader className={rosePrepDialogHeaderClass}>
          <DialogTitle className="font-display">بيانات نموذج الاستقالة</DialogTitle>
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
              <Label htmlFor="res-to-ar">موجّه إلى (عربي)</Label>
              <Input
                id="res-to-ar"
                value={wizard.addressedToAr}
                onChange={(e) => patchWizard('addressedToAr', e.target.value)}
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-to-en">Addressed to (English)</Label>
              <Input
                id="res-to-en"
                value={wizard.addressedToEn}
                onChange={(e) => patchWizard('addressedToEn', e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-abs">تاريخ بداية الاستقالة</Label>
              <DatePickerInput
                id="res-abs"
                value={wizard.absenceStartIso}
                onChange={(v) => patchWizard('absenceStartIso', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-foot-date">تاريخ التذييل</Label>
              <DatePickerInput
                id="res-foot-date"
                value={wizard.footerDateIso}
                onChange={(v) => patchWizard('footerDateIso', v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-reasons">أسباب الاستقالة (كل سطر = نقطة)</Label>
            <Textarea
              id="res-reasons"
              value={wizard.reasonLines.join('\n')}
              onChange={(e) =>
                patchWizard(
                  'reasonLines',
                  e.target.value.split('\n').map((x) => x.trim()).filter(Boolean),
                )
              }
              rows={4}
              className="resize-y text-right text-sm leading-relaxed"
              dir="rtl"
              placeholder={'مثال:\nاستكمال مسار مهني\nظروف عائلية'}
            />
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
          <Button type="button" variant="luxe" onClick={() => onApply(wizard)}>
            إنشاء معاينة PDF
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

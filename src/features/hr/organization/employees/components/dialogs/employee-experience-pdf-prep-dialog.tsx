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
import { createDefaultExperienceWizard } from '@/features/hr/organization/employees/lib/rose-document-templates/build-experience-print-model';
import { useRoseExperienceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/experience-template-store';
import type {
  ExperienceWizardPayload,
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
  onApply: (wizard: ExperienceWizardPayload) => void;
  onOpenTemplateSettings: () => void;
};

export function EmployeeExperiencePdfPrepDialog({
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
  const template = useRoseExperienceTemplateStore((s) => s.template);
  const [wizard, setWizard] = React.useState<ExperienceWizardPayload>(() =>
    createDefaultExperienceWizard(employee, template),
  );

  React.useEffect(() => {
    if (!open) return;
    setWizard(createDefaultExperienceWizard(employee, template));
  }, [open, employee, template]);

  const mergePreviewCtx = useRoseMergePreviewCtx(
    employee, branchNameAr, departmentNameAr, companyNameAr, companyNameEn,
    {
      footerDateIso: wizard.footerDateIso,
      endDateIso: wizard.endDateIso,
      serviceStartIso: wizard.serviceStartIso,
      certificateDateIso: wizard.certificateDateIso,
    },
  );

  const patchWizard = <K extends keyof ExperienceWizardPayload>(key: K, value: ExperienceWizardPayload[K]) =>
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
          <DialogTitle className="font-display">بيانات شهادة الخبرة</DialogTitle>
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
              <Label htmlFor="exp-start">تاريخ بداية الخدمة</Label>
              <Input
                id="exp-start"
                type="date"
                value={wizard.serviceStartIso}
                onChange={(e) => patchWizard('serviceStartIso', e.target.value)}
                className="font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-end">تاريخ نهاية الخدمة</Label>
              <Input
                id="exp-end"
                type="date"
                value={wizard.endDateIso}
                onChange={(e) => patchWizard('endDateIso', e.target.value)}
                className="font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-cert-date">تاريخ الشهادة</Label>
              <Input
                id="exp-cert-date"
                type="date"
                value={wizard.certificateDateIso}
                onChange={(e) => patchWizard('certificateDateIso', e.target.value)}
                className="font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-foot-date">تاريخ التذييل</Label>
              <Input
                id="exp-foot-date"
                type="date"
                value={wizard.footerDateIso}
                onChange={(e) => patchWizard('footerDateIso', e.target.value)}
                className="font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-perf-ar">وصف الأداء (عربي) — اختياري</Label>
            <Textarea
              id="exp-perf-ar"
              value={wizard.performanceTextAr}
              onChange={(e) => patchWizard('performanceTextAr', e.target.value)}
              rows={3}
              className="resize-y text-right text-sm"
              dir="rtl"
              placeholder="اتركه فارغاً لاستخدام النص الافتراضي من القالب"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-perf-en">Performance description (English) — optional</Label>
            <Textarea
              id="exp-perf-en"
              value={wizard.performanceTextEn}
              onChange={(e) => patchWizard('performanceTextEn', e.target.value)}
              rows={3}
              className="resize-y text-sm"
              dir="ltr"
              placeholder="Leave empty to use template default"
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
          <Button type="button" variant="luxe" onClick={() => onApply(wizard)}>إنشاء معاينة PDF</Button>
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

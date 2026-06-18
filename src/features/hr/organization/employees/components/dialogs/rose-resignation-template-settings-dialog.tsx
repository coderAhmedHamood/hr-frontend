'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LocalizedTextField } from '@/features/hr/organization/employees/components/dialogs/rose-localized-text-field';
import { useRoseResignationTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/resignation-template-store';
import { ROSE_MERGE_FIELD_CATALOG } from '@/features/hr/organization/employees/lib/rose-document-templates/merge-field-catalog';
import type { LocalizedText, RoseMergeFieldKey, RoseResignationTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoseResignationTemplateSettingsDialog({ open, onOpenChange }: Props) {
  const template = useRoseResignationTemplateStore((s) => s.template);
  const updateTemplate = useRoseResignationTemplateStore((s) => s.updateTemplate);
  const resetTemplate = useRoseResignationTemplateStore((s) => s.resetTemplate);
  const [draft, setDraft] = React.useState(template);

  React.useEffect(() => {
    if (open) setDraft(template);
  }, [open, template]);

  const patchLocalized = (
    key: keyof Pick<
      RoseResignationTemplateContent,
      | 'title'
      | 'openingLine'
      | 'greeting'
      | 'reasonsHeading'
      | 'bodyIntro'
      | 'bodyClosing'
      | 'footerApplicantLabel'
      | 'footerSignatureLabel'
      | 'footerDateLabel'
    >,
    value: LocalizedText,
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const setSlotVisible = (fieldKey: RoseMergeFieldKey, visible: boolean) => {
    setDraft((d) => ({
      ...d,
      fieldSlots: d.fieldSlots.map((s) =>
        s.fieldKey === fieldKey ? { ...s, visible } : s,
      ),
    }));
  };

  const employeeFields = ROSE_MERGE_FIELD_CATALOG.filter((f) => f.group === 'employee');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-right">
          <DialogTitle className="font-display">إعدادات قالب الاستقالة</DialogTitle>
          <DialogDescription className="sr-only">
            تخصيص النصوص الافتراضية والحقول الظاهرة في نموذج الاستقالة
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            تُحفظ الإعدادات على هذا الجهاز وتُطبَّق على كل نماذج الاستقالة الجديدة.
          </p>
        </DialogHeader>

        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-5 py-4 space-y-5 text-right">
          <LocalizedTextField
            labelAr="عنوان النموذج (عربي)"
            labelEn="Form title (English)"
            value={draft.title}
            onChange={(v) => patchLocalized('title', v)}
          />

          <LocalizedTextField
            labelAr="التحية الافتتاحية (عربي)"
            labelEn="Greeting (English)"
            value={draft.greeting}
            onChange={(v) => patchLocalized('greeting', v)}
          />

          <LocalizedTextField
            labelAr="موجّه إلى (افتراضي — عربي)"
            labelEn="Addressed to (default — English)"
            value={draft.openingLine}
            onChange={(v) => patchLocalized('openingLine', v)}
          />

          <LocalizedTextField
            labelAr="نص الطلب (عربي)"
            labelEn="Request body (English)"
            value={draft.bodyIntro}
            onChange={(v) => patchLocalized('bodyIntro', v)}
            multiline
            rows={3}
          />

          <LocalizedTextField
            labelAr="ختام الطلب (عربي)"
            labelEn="Closing paragraph (English)"
            value={draft.bodyClosing}
            onChange={(v) => patchLocalized('bodyClosing', v)}
            multiline
            rows={2}
          />

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="mb-3 text-xs font-semibold">الحقول الافتراضية في جدول البيانات</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {employeeFields.map((field) => {
                const slot = draft.fieldSlots.find((s) => s.fieldKey === field.key);
                const visible = slot?.visible ?? false;
                return (
                  <label
                    key={field.key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{field.labelAr}</p>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{field.labelEn}</p>
                    </div>
                    <Switch
                      checked={visible}
                      onCheckedChange={(v) => setSlotVisible(field.key, v)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className={`${dialogFormFooterClass} border-t border-border px-5 py-4`}>
          <Button
            type="button"
            variant="luxe"
            onClick={() => {
              updateTemplate(draft);
              toast.success('تم حفظ إعدادات القالب');
              onOpenChange(false);
            }}
          >
            حفظ الإعدادات
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetTemplate();
              setDraft(useRoseResignationTemplateStore.getState().template);
              toast.success('تمت استعادة القالب الافتراضي');
            }}
          >
            استعادة الافتراضي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { LocalizedTextField } from '@/features/hr/organization/employees/components/dialogs/rose-localized-text-field';
import {
  rosePrepDialogBodyClass,
  rosePrepDialogContentClass,
  rosePrepDialogFooterClass,
  rosePrepDialogHeaderClass,
} from '@/features/hr/organization/employees/components/dialogs/rose-document-prep-shared';
import { useRoseResignationTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/resignation-template-store';
import { useRoseClearanceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/clearance-template-store';
import { useRoseSettlementTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/settlement-template-store';
import { useRoseExperienceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/experience-template-store';
import { ROSE_MERGE_FIELD_CATALOG } from '@/features/hr/organization/employees/lib/rose-document-templates/merge-field-catalog';
import type {
  LocalizedText,
  RoseClearanceTemplateContent,
  RoseExperienceTemplateContent,
  RoseFormKind,
  RoseMergeFieldKey,
  RoseResignationTemplateContent,
  RoseSettlementTemplateContent,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: RoseFormKind;
};

const TABS: { id: RoseFormKind; label: string }[] = [
  { id: 'resignation', label: 'استقالة' },
  { id: 'clearance', label: 'إخلاء طرف' },
  { id: 'settlement', label: 'مخالصة' },
  { id: 'experience', label: 'شهادة خبرة' },
];

function FieldSlotsEditor({
  fieldSlots,
  onToggle,
}: {
  fieldSlots: { fieldKey: RoseMergeFieldKey; visible: boolean }[];
  onToggle: (key: RoseMergeFieldKey, visible: boolean) => void;
}) {
  const employeeFields = ROSE_MERGE_FIELD_CATALOG.filter((f) => f.group === 'employee');
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="mb-3 text-xs font-semibold">الحقول الافتراضية في جدول البيانات</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {employeeFields.map((field) => {
          const slot = fieldSlots.find((s) => s.fieldKey === field.key);
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
              <Switch checked={visible} onCheckedChange={(v) => onToggle(field.key, v)} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ResignationTab() {
  const template = useRoseResignationTemplateStore((s) => s.template);
  const updateTemplate = useRoseResignationTemplateStore((s) => s.updateTemplate);
  const resetTemplate = useRoseResignationTemplateStore((s) => s.resetTemplate);
  const [draft, setDraft] = React.useState(template);

  React.useEffect(() => setDraft(template), [template]);

  const patch = (key: keyof RoseResignationTemplateContent, value: LocalizedText) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="space-y-5">
      <LocalizedTextField labelAr="عنوان النموذج" labelEn="Form title" value={draft.title} onChange={(v) => patch('title', v)} />
      <LocalizedTextField labelAr="التحية" labelEn="Greeting" value={draft.greeting} onChange={(v) => patch('greeting', v)} />
      <LocalizedTextField labelAr="موجّه إلى (افتراضي)" labelEn="Addressed to (default)" value={draft.openingLine} onChange={(v) => patch('openingLine', v)} />
      <LocalizedTextField labelAr="نص الطلب" labelEn="Request body" value={draft.bodyIntro} onChange={(v) => patch('bodyIntro', v)} multiline rows={3} />
      <LocalizedTextField labelAr="ختام الطلب" labelEn="Closing" value={draft.bodyClosing} onChange={(v) => patch('bodyClosing', v)} multiline rows={2} />
      <FieldSlotsEditor
        fieldSlots={draft.fieldSlots}
        onToggle={(key, visible) =>
          setDraft((d) => ({
            ...d,
            fieldSlots: d.fieldSlots.map((s) => (s.fieldKey === key ? { ...s, visible } : s)),
          }))
        }
      />
      <div className="flex gap-2">
        <Button type="button" variant="luxe" size="sm" onClick={() => { updateTemplate(draft); toast.success('تم حفظ قالب الاستقالة'); }}>
          حفظ
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { resetTemplate(); setDraft(useRoseResignationTemplateStore.getState().template); toast.success('تمت الاستعادة'); }}>
          استعادة الافتراضي
        </Button>
      </div>
    </div>
  );
}

function ClearanceTab() {
  const template = useRoseClearanceTemplateStore((s) => s.template);
  const updateTemplate = useRoseClearanceTemplateStore((s) => s.updateTemplate);
  const resetTemplate = useRoseClearanceTemplateStore((s) => s.resetTemplate);
  const [draft, setDraft] = React.useState(template);

  React.useEffect(() => setDraft(template), [template]);

  const patch = (key: keyof RoseClearanceTemplateContent, value: LocalizedText) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="space-y-5">
      <LocalizedTextField labelAr="عنوان النموذج" labelEn="Form title" value={draft.title} onChange={(v) => patch('title', v)} />
      <LocalizedTextField labelAr="الإقرار القانوني" labelEn="Legal declaration" value={draft.legalDeclaration} onChange={(v) => patch('legalDeclaration', v)} multiline rows={4} />
      <LocalizedTextField labelAr="عنوان سبب الإخلاء" labelEn="Reason heading" value={draft.reasonHeading} onChange={(v) => patch('reasonHeading', v)} />
      <FieldSlotsEditor
        fieldSlots={draft.fieldSlots}
        onToggle={(key, visible) =>
          setDraft((d) => ({
            ...d,
            fieldSlots: d.fieldSlots.map((s) => (s.fieldKey === key ? { ...s, visible } : s)),
          }))
        }
      />
      <div className="flex gap-2">
        <Button type="button" variant="luxe" size="sm" onClick={() => { updateTemplate(draft); toast.success('تم حفظ قالب إخلاء الطرف'); }}>
          حفظ
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { resetTemplate(); setDraft(useRoseClearanceTemplateStore.getState().template); toast.success('تمت الاستعادة'); }}>
          استعادة الافتراضي
        </Button>
      </div>
    </div>
  );
}

function SettlementTab() {
  const template = useRoseSettlementTemplateStore((s) => s.template);
  const updateTemplate = useRoseSettlementTemplateStore((s) => s.updateTemplate);
  const resetTemplate = useRoseSettlementTemplateStore((s) => s.resetTemplate);
  const [draft, setDraft] = React.useState(template);

  React.useEffect(() => setDraft(template), [template]);

  return (
    <div className="space-y-5">
      <LocalizedTextField labelAr="عنوان النموذج" labelEn="Form title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
      {draft.bodyParagraphs.map((p, i) => (
        <LocalizedTextField
          key={i}
          labelAr={`فقرة ${i + 1} (عربي)`}
          labelEn={`Paragraph ${i + 1} (English)`}
          value={p}
          onChange={(v) =>
            setDraft((d) => ({
              ...d,
              bodyParagraphs: d.bodyParagraphs.map((para, idx) => (idx === i ? v : para)),
            }))
          }
          multiline
          rows={2}
        />
      ))}
      <FieldSlotsEditor
        fieldSlots={draft.fieldSlots}
        onToggle={(key, visible) =>
          setDraft((d) => ({
            ...d,
            fieldSlots: d.fieldSlots.map((s) => (s.fieldKey === key ? { ...s, visible } : s)),
          }))
        }
      />
      <div className="flex gap-2">
        <Button type="button" variant="luxe" size="sm" onClick={() => { updateTemplate(draft); toast.success('تم حفظ قالب المخالصة'); }}>
          حفظ
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { resetTemplate(); setDraft(useRoseSettlementTemplateStore.getState().template); toast.success('تمت الاستعادة'); }}>
          استعادة الافتراضي
        </Button>
      </div>
    </div>
  );
}

function ExperienceTab() {
  const template = useRoseExperienceTemplateStore((s) => s.template);
  const updateTemplate = useRoseExperienceTemplateStore((s) => s.updateTemplate);
  const resetTemplate = useRoseExperienceTemplateStore((s) => s.resetTemplate);
  const [draft, setDraft] = React.useState(template);

  React.useEffect(() => setDraft(template), [template]);

  const patch = (key: keyof RoseExperienceTemplateContent, value: LocalizedText) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="space-y-5">
      <LocalizedTextField labelAr="عنوان الشهادة" labelEn="Certificate title" value={draft.title} onChange={(v) => patch('title', v)} />
      <LocalizedTextField labelAr="نص الشهادة" labelEn="Certificate body" value={draft.bodyIntro} onChange={(v) => patch('bodyIntro', v)} multiline rows={3} />
      <LocalizedTextField labelAr="عنوان الأداء" labelEn="Performance heading" value={draft.performanceHeading} onChange={(v) => patch('performanceHeading', v)} />
      <LocalizedTextField labelAr="وصف الأداء" labelEn="Performance traits" value={draft.performanceTraits} onChange={(v) => patch('performanceTraits', v)} multiline rows={3} />
      <LocalizedTextField labelAr="ختام التمنيات" labelEn="Closing wish" value={draft.closingWish} onChange={(v) => patch('closingWish', v)} />
      <LocalizedTextField labelAr="توقيع المدير" labelEn="Manager signature title" value={draft.managerSignatureTitle} onChange={(v) => patch('managerSignatureTitle', v)} />
      <FieldSlotsEditor
        fieldSlots={draft.fieldSlots}
        onToggle={(key, visible) =>
          setDraft((d) => ({
            ...d,
            fieldSlots: d.fieldSlots.map((s) => (s.fieldKey === key ? { ...s, visible } : s)),
          }))
        }
      />
      <div className="flex gap-2">
        <Button type="button" variant="luxe" size="sm" onClick={() => { updateTemplate(draft); toast.success('تم حفظ قالب شهادة الخبرة'); }}>
          حفظ
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { resetTemplate(); setDraft(useRoseExperienceTemplateStore.getState().template); toast.success('تمت الاستعادة'); }}>
          استعادة الافتراضي
        </Button>
      </div>
    </div>
  );
}

export function RoseFormsTemplateSettingsDialog({ open, onOpenChange, initialTab = 'resignation' }: Props) {
  const [tab, setTab] = React.useState<RoseFormKind>(initialTab);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={rosePrepDialogContentClass}>
        <DialogHeader className={rosePrepDialogHeaderClass}>
          <DialogTitle className="font-display">إعدادات قوالب روز</DialogTitle>
          <DialogDescription className="sr-only">تخصيص النصوص والحقول الافتراضية لنماذج الموارد البشرية</DialogDescription>
          <p className="text-xs text-muted-foreground">
            تُحفظ الإعدادات على هذا الجهاز وتُطبَّق على كل النماذج الجديدة.
          </p>
        </DialogHeader>

        <div className="shrink-0 flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/40',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={rosePrepDialogBodyClass}>
          {tab === 'resignation' && <ResignationTab />}
          {tab === 'clearance' && <ClearanceTab />}
          {tab === 'settlement' && <SettlementTab />}
          {tab === 'experience' && <ExperienceTab />}
        </div>

        <DialogFooter className={rosePrepDialogFooterClass}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

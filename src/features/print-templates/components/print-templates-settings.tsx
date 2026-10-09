'use client';

import * as React from 'react';
import { Check, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/shared/utils';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { PrintDocumentView } from '@/features/print-templates/components/print-document-view';
import {
  PRINT_DOCUMENTS,
  PRINT_PAPERS,
  PRINT_TEMPLATES,
  type PrintDocumentType,
  type PrintTemplateSettings,
} from '@/features/print-templates/domain/types';
import { printElement } from '@/features/print-templates/lib/print-html';
import { toPrintCompany } from '@/features/print-templates/lib/print-company';
import {
  documentStarter,
  resolveDocumentPrintSettings,
  resolvePrintTemplateSettings,
  useCompanyPrintTemplates,
  useSavePrintTemplate,
} from '@/features/print-templates/lib/print-template-store';
import { samplePrintDocument } from '@/features/print-templates/lib/sample-document';

type HeaderKey = Exclude<keyof PrintTemplateSettings['header'], 'extraLines'>;

const HEADER_TOGGLES: ReadonlyArray<{ key: HeaderKey; label: string }> = [
  { key: 'showLogo', label: 'الشعار' },
  { key: 'showCompanyName', label: 'اسم الشركة' },
  { key: 'showTaxNumber', label: 'الرقم الضريبي' },
  { key: 'showCommercialRegistration', label: 'السجل التجاري' },
  { key: 'showPhone', label: 'الهاتف' },
  { key: 'showAddress', label: 'العنوان' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Print templates: the company's unified template, and for each document
 * (POS receipt, inventory receipt / delivery / transfer) either the unified
 * one or a template of its own. Saved on the server for the whole company.
 */
export function PrintTemplatesSettings() {
  const companyId = useDefaultCompanyId();
  const { data: company } = useActiveCompany();
  const { data: templates } = useCompanyPrintTemplates(companyId);
  const saveTemplate = useSavePrintTemplate(companyId);
  const [documentType, setDocumentType] = React.useState<PrintDocumentType>('default');
  // A document has its own template when one is saved for it.
  const hasOwn = documentType !== 'default' && Boolean(templates?.[documentType]);
  const [useUnified, setUseUnified] = React.useState(!hasOwn);
  const saved = React.useMemo(
    () =>
      documentType === 'default'
        ? resolvePrintTemplateSettings(templates?.default, documentStarter('default'))
        : resolveDocumentPrintSettings(templates, documentType),
    [templates, documentType],
  );
  const [draft, setDraft] = React.useState<PrintTemplateSettings>(saved);
  const previewRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setDraft(saved), [saved]);
  React.useEffect(() => setUseUnified(!hasOwn), [hasOwn, documentType]);

  const printCompany = toPrintCompany(company);
  const sample = samplePrintDocument(documentType);
  const editing = documentType === 'default' || !useUnified;
  const unifiedSettings = resolvePrintTemplateSettings(templates?.default, documentStarter('default'));
  const shown = editing ? draft : unifiedSettings;
  const dirty =
    documentType !== 'default' && useUnified === hasOwn
      ? true
      : editing && JSON.stringify(draft) !== JSON.stringify(saved);

  const patchHeader = (patch: Partial<PrintTemplateSettings['header']>) =>
    setDraft((d) => ({ ...d, header: { ...d.header, ...patch } }));
  const patchFooter = (patch: Partial<PrintTemplateSettings['footer']>) =>
    setDraft((d) => ({ ...d, footer: { ...d.footer, ...patch } }));

  const handleSave = async () => {
    if (!companyId) return;
    const name = PRINT_DOCUMENTS.find((d) => d.id === documentType)?.nameAr ?? '';
    try {
      await saveTemplate.mutateAsync({
        documentType,
        settings: documentType !== 'default' && useUnified ? null : draft,
      });
      toast.success(
        documentType === 'default'
          ? 'حُفظ القالب الموحّد. تطبع به كل المستندات التي ليس لها قالب خاص.'
          : useUnified
            ? `«${name}» يطبع الآن بالقالب الموحّد.`
            : `حُفظ قالب «${name}».`,
      );
    } catch {
      toast.error('تعذّر حفظ القالب — تأكد من صلاحية تعديل إعدادات الشركة.');
    }
  };

  return (
    <div className="space-y-4">
      <Section title="المستند">
        <div className="flex flex-wrap gap-2">
          {PRINT_DOCUMENTS.map((d) => {
            const active = documentType === d.id;
            const own = d.id !== 'default' && Boolean(templates?.[d.id]);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDocumentType(d.id)}
                aria-pressed={active}
                className={cn(
                  'rounded-lg border px-3 py-2 text-start text-sm transition',
                  active ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border hover:border-primary/40',
                )}
              >
                <span className="block font-semibold">{d.nameAr}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {d.id === 'default' ? d.descriptionAr : own ? 'قالب خاص' : 'يستخدم القالب الموحّد'}
                </span>
              </button>
            );
          })}
        </div>
        {documentType !== 'default' ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span>
              يستخدم القالب الموحّد
              <span className="block text-xs text-muted-foreground">
                أوقفه لتصميم قالب خاص بـ«{PRINT_DOCUMENTS.find((d) => d.id === documentType)?.nameAr}» (مثلًا ورق A4 لسندات المخازن).
              </span>
            </span>
            <Switch
              aria-label="يستخدم القالب الموحّد"
              checked={useUnified}
              onCheckedChange={(v) => {
                setUseUnified(v);
                if (!v && !hasOwn) setDraft(documentStarter(documentType));
              }}
            />
          </div>
        ) : null}
      </Section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className={cn('min-w-0 space-y-4', !editing && 'pointer-events-none opacity-50')} aria-disabled={!editing}>
        <Section title="شكل القالب">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {PRINT_TEMPLATES.map((t) => {
              const active = draft.templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, templateId: t.id }))}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-lg border text-start transition',
                    active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40',
                  )}
                  aria-pressed={active}
                >
                  <div className="pointer-events-none flex h-44 justify-center overflow-hidden bg-muted/40 pt-2">
                    <div style={{ transform: 'scale(0.42)', transformOrigin: 'top center' }}>
                      <PrintDocumentView
                        document={sample}
                        company={printCompany}
                        settings={{ ...draft, templateId: t.id, paper: '80mm' }}
                      />
                    </div>
                  </div>
                  <div className="border-t border-border p-2">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      {active ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                      {t.nameAr}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.descriptionAr}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="الورق">
          <div className="flex flex-wrap gap-2">
            {PRINT_PAPERS.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={draft.paper === p.id ? 'default' : 'outline'}
                onClick={() => setDraft((d) => ({ ...d, paper: p.id }))}
              >
                {p.nameAr}
              </Button>
            ))}
          </div>
        </Section>

        <Section title="الترويسة">
          <div className="grid gap-3 sm:grid-cols-3">
            {HEADER_TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                {t.label}
                <Switch checked={draft.header[t.key]} onCheckedChange={(v) => patchHeader({ [t.key]: v })} />
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <Label>سطور إضافية تحت الاسم (سطر لكل معلومة)</Label>
            <Textarea
              rows={2}
              value={draft.header.extraLines}
              onChange={(e) => patchHeader({ extraLines: e.target.value })}
              placeholder="مثال: فرع الشارع الرئيسي"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            الشعار والاسم والرقم الضريبي والهاتف والعنوان تُقرأ من «البيانات الأساسية» للشركة.
          </p>
        </Section>

        <Section title="التذييل">
          <div className="space-y-1.5">
            <Label>نص التذييل (سطر لكل جملة)</Label>
            <Textarea
              rows={3}
              value={draft.footer.text}
              onChange={(e) => patchFooter({ text: e.target.value })}
              placeholder="شكرًا لزيارتكم&#10;الاسترجاع خلال 7 أيام بالإيصال"
            />
          </div>
          <label className="mt-3 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span>
              رمز QR لرقم المستند
              <span className="block text-xs text-muted-foreground">للبحث عن الإيصال عند المرتجع. ليس رمزًا ضريبيًا.</span>
            </span>
            <Switch checked={draft.footer.showDocumentQr} onCheckedChange={(v) => patchFooter({ showDocumentQr: v })} />
          </label>
          <label className="mt-3 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span>
              خانات التوقيع
              <span className="block text-xs text-muted-foreground">
                في سندات المخازن: المستلم، أمين المخزن، المعتمد.
              </span>
            </span>
            <Switch
              checked={draft.footer.showSignatures}
              onCheckedChange={(v) => patchFooter({ showSignatures: v })}
            />
          </label>
        </Section>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">معاينة</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => previewRef.current && printElement(previewRef.current.firstElementChild as HTMLElement, shown.paper)}
            >
              <Printer className="h-4 w-4" />
              طباعة تجريبية
            </Button>
          </div>
          <div className="flex max-h-[70vh] justify-center overflow-auto rounded-md bg-background p-2">
            <div ref={previewRef} className={cn(shown.paper === 'a4' && 'origin-top scale-[0.45]')}>
              <PrintDocumentView document={sample} company={printCompany} settings={shown} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            onClick={() => void handleSave()}
            disabled={!dirty || !companyId || saveTemplate.isPending}
          >
            <Save className="h-4 w-4" />
            حفظ واعتماد القالب
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(saved);
              setUseUnified(!hasOwn);
            }}
            disabled={!dirty}
          >
            تراجع
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          القوالب محفوظة للشركة كلها: يطبع بها كل المستخدمين على كل الأجهزة. الطباعة لا تعني امتثالًا ضريبيًا؛ الفوترة الإلكترونية تُضاف لكل دولة على حدة.
        </p>
      </aside>
      </div>
    </div>
  );
}

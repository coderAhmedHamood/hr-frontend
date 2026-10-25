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
import { useCompanyApps } from '@/shared/modules/company-apps';
import { PrintDocumentView } from '@/features/print-templates/components/print-document-view';
import {
  CONFIGURABLE_PRINT_DOCUMENTS,
  DOCUMENT_LAYOUTS,
  DOCUMENT_TABLE_STYLES,
  PRINT_PAPERS,
  type DocumentLayout,
  type PrintDocumentType,
  type PrintTemplateId,
  type PrintTemplateSettings,
} from '@/features/print-templates/domain/types';
import { printElement } from '@/features/print-templates/lib/print-html';
import { toPrintCompany } from '@/features/print-templates/lib/print-company';
import {
  documentStarter,
  resolvePrintTemplateSettings,
  useCompanyPrintTemplates,
  useSavePrintTemplate,
} from '@/features/print-templates/lib/print-template-store';
import { samplePrintDocument } from '@/features/print-templates/lib/sample-document';

type HeaderKey = Exclude<keyof PrintTemplateSettings['header'], 'extraLines'>;

const TEMPLATE_OF_LAYOUT: Record<DocumentLayout, PrintTemplateId> = {
  light: 'formal',
  striped: 'elegant',
  wave: 'modern',
  boxed: 'classic',
};

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
 * Two company identities: one official A4 identity inherited by every
 * business document, and one thermal identity used only by POS receipts.
 */
export function PrintTemplatesSettings() {
  const companyId = useDefaultCompanyId();
  const { data: company } = useActiveCompany();
  const { data: templates } = useCompanyPrintTemplates(companyId);
  const saveTemplate = useSavePrintTemplate(companyId);
  const [pickedDocumentType, setDocumentType] = React.useState<PrintDocumentType>('default');
  // Documents of a disabled app (the POS receipt) are not shown.
  const documents = useCompanyApps().filter(CONFIGURABLE_PRINT_DOCUMENTS);
  const documentType = documents.some((d) => d.id === pickedDocumentType)
    ? pickedDocumentType
    : 'default';
  const saved = React.useMemo(
    () => {
      const settings = resolvePrintTemplateSettings(templates?.[documentType], documentStarter(documentType));
      return {
        ...settings,
        paper:
          documentType === 'pos_receipt'
            ? settings.paper === '58mm'
              ? '58mm'
              : '80mm'
            : 'a4',
      } as PrintTemplateSettings;
    },
    [templates, documentType],
  );
  const [draft, setDraft] = React.useState<PrintTemplateSettings>(saved);
  const previewRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setDraft(saved), [saved]);

  const printCompany = toPrintCompany(company);
  const sample = samplePrintDocument(documentType);
  const official = documentType !== 'pos_receipt';
  const shown = draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const patchHeader = (patch: Partial<PrintTemplateSettings['header']>) =>
    setDraft((d) => ({ ...d, header: { ...d.header, ...patch } }));
  const patchFooter = (patch: Partial<PrintTemplateSettings['footer']>) =>
    setDraft((d) => ({ ...d, footer: { ...d.footer, ...patch } }));

  const handleSave = async () => {
    if (!companyId) return;
    const name = documents.find((d) => d.id === documentType)?.nameAr ?? '';
    try {
      await saveTemplate.mutateAsync({
        documentType,
        settings: draft,
      });
      toast.success(
        documentType === 'default'
          ? 'حُفظت الهوية الرسمية. ستستخدمها كل السندات والتقارير.'
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
          {documents.map((d) => {
            const active = documentType === d.id;
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
                <span className="block text-[11px] text-muted-foreground">{d.descriptionAr}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {documentType === 'default'
            ? 'تُضبط مرة واحدة وتُطبّق على سندات الاستلام والصرف والتحويل والجرد والتسويات، وعلى أي مستند رسمي جديد.'
            : 'إيصالات نقاط البيع مستقلة وتبقى على طابعة حرارية 80 أو 58 مم.'}
        </p>
      </Section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {official ? (
          <>
            <Section title="مخطط الصفحة">
              <div className="flex flex-wrap gap-2">
                {DOCUMENT_LAYOUTS.map((layout) => (
                  <Button
                    key={layout.id}
                    type="button"
                    size="sm"
                    variant={draft.layout === layout.id ? 'default' : 'outline'}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        layout: layout.id,
                        templateId: TEMPLATE_OF_LAYOUT[layout.id],
                      }))
                    }
                  >
                    {draft.layout === layout.id ? <Check className="h-3.5 w-3.5" /> : null}
                    {layout.nameAr}
                  </Button>
                ))}
              </div>
            </Section>
            <Section title="الجدول">
              <div className="flex flex-wrap gap-2">
                {DOCUMENT_TABLE_STYLES.map((table) => (
                  <Button
                    key={table.id}
                    type="button"
                    size="sm"
                    variant={draft.tableStyle === table.id ? 'default' : 'outline'}
                    onClick={() => setDraft((current) => ({ ...current, tableStyle: table.id }))}
                  >
                    {draft.tableStyle === table.id ? <Check className="h-3.5 w-3.5" /> : null}
                    {table.nameAr}
                  </Button>
                ))}
              </div>
            </Section>
            <Section title="الشعار والألوان">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full border" style={{ background: printCompany.primaryColor || '#6d4c9a' }} />
                <span className="h-6 w-6 rounded-full border" style={{ background: printCompany.secondaryColor || '#ece8f3' }} />
                <span className="text-xs text-muted-foreground">من البيانات الأساسية للشركة</span>
              </div>
              <Label>سطر التعارف تحت اسم الشركة</Label>
              <Textarea
                rows={2}
                className="mt-1.5"
                value={draft.slogan}
                onChange={(event) => setDraft((current) => ({ ...current, slogan: event.target.value }))}
                placeholder="مثال: حلول الأعمال العالمية"
              />
            </Section>
          </>
        ) : (
          <Section title="الإيصال الحراري">
            <p className="text-sm leading-relaxed text-muted-foreground">
              إيصال نقاط البيع ورقة صغيرة مستقلة: الشعار في الأعلى، ثم رمز المستند، ورقمه، والكاشير، والأصناف. لا يستخدم مخطط الأوراق الرسمية.
            </p>
          </Section>
        )}

        <Section title="الورق">
          <div className="flex flex-wrap gap-2">
            {PRINT_PAPERS.filter((p) =>
              documentType === 'pos_receipt' ? p.id !== 'a4' : p.id === 'a4',
            ).map((p) => (
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
            }}
            disabled={!dirty}
          >
            تراجع
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          الهوية محفوظة للشركة كلها ويستخدمها جميع المستخدمين والأجهزة. الطباعة لا تعني امتثالًا ضريبيًا؛ الفوترة الإلكترونية تُضاف لكل دولة على حدة.
        </p>
      </aside>
      </div>
    </div>
  );
}

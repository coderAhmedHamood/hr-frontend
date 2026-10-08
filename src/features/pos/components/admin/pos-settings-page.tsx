'use client';

import * as React from 'react';
import Link from 'next/link';
import { Boxes, PackageX, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';
import { PRINT_TEMPLATES } from '@/features/print-templates/domain/types';
import { usePrintTemplateSettings } from '@/features/print-templates/lib/print-template-store';
import { PAYMENT_METHOD_LABELS, type PosPaymentMethod, type PosSettings, type PosStockMode } from '@/features/pos/domain/types';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { parseAmount } from '@/features/pos/lib/format';
import { PosGate, PosPreviewNote } from '@/features/pos/components/shared/pos-shared';

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
      <span>
        {label}
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input dir="ltr" inputMode="decimal" value={String(value)} onChange={(e) => onChange(parseAmount(e.target.value))} className="h-9" />
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

const STOCK_MODES: ReadonlyArray<{ id: PosStockMode; title: string; description: string; icon: typeof Boxes }> = [
  {
    id: 'none',
    title: 'دون تتبع الكمية',
    description: 'يبيع دون فحص أو خصم كمية. مناسب لمن لا يستخدم المخازن. الكميات المباعة تظهر في التقارير.',
    icon: PackageX,
  },
  {
    id: 'inventory',
    title: 'مربوط بالمخازن',
    description: 'الكمية من المخازن: حجز قبل الدفع، وصرف عند الاكتمال من مستودع نقطة البيع، وحماية حجوزات المتجر.',
    icon: Boxes,
  },
];

function Settings() {
  const { companyId, data, actions, can, userName } = usePosContext();
  const template = usePrintTemplateSettings(companyId);
  const [draft, setDraft] = React.useState<PosSettings>(data.settings);
  React.useEffect(() => setDraft(data.settings), [data.settings]);

  const canEdit = can('pos.settings.manage');
  const openSessions = data.sessions.filter((s) => s.status === 'open').length;
  const unsettledSales = data.sales.filter(
    (s) => s.status === 'awaiting_payment' || s.status === 'payment_exception',
  ).length;
  const change = data.settings.stockModeChange;
  const drained = openSessions === 0 && unsettledSales === 0;
  const modeTitle = (id: PosStockMode) => STOCK_MODES.find((m) => m.id === id)?.title ?? id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);
  const templateName = PRINT_TEMPLATES.find((t) => t.id === template.templateId)?.nameAr;

  const set = <K extends keyof PosSettings>(key: K, patch: Partial<PosSettings[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] as object), ...patch } }));

  const save = () => {
    if (!actions) return;
    if (!Object.values(draft.paymentMethods).some(Boolean)) {
      toast.error('فعّل وسيلة دفع واحدة على الأقل');
      return;
    }
    actions.saveSettings(draft);
    toast.success('حُفظت إعدادات نقاط البيع');
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="إعدادات نقاط البيع" iconName="Settings" />
      <PosPreviewNote />

      <Card
        title="وضع المخزون"
        description="على مستوى الشركة: كل نقاط البيع مربوطة أو لا شيء منها، فلا تبيع نقطتان البضاعة نفسها إحداهما تخصم والأخرى لا."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {STOCK_MODES.map((m) => {
            const Icon = m.icon;
            const active = data.settings.stockMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                disabled={!canEdit || active || Boolean(change)}
                onClick={() => actions?.requestStockModeChange(m.id, userName)}
                className={cn(
                  'flex gap-3 rounded-lg border p-3 text-start transition disabled:cursor-not-allowed',
                  active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span>
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{m.description}</span>
                </span>
              </button>
            );
          })}
        </div>
        {change ? (
          <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed">
            <p className="font-semibold">
              تبديل قيد التنفيذ: من «{modeTitle(data.settings.stockMode)}» إلى «{modeTitle(change.to)}» (طلبه{' '}
              {change.requestedBy}).
            </p>
            <p>
              لا تُفتح ورديات جديدة الآن. الورديات المفتوحة ({openSessions}) تكمل بوضعها، والمبيعات بانتظار الدفع
              أو الاستثناءات ({unsettledSales}) تُحسم. بعدها تؤكد الوضع الجديد صراحة — لا انتقال تلقائي.
            </p>
            {change.to === 'none' ? (
              <p className="text-warning">
                بعد التأكيد لن ترى المخازن مبيعات نقاط البيع، ومرتجعات مبيعات المخازن السابقة تُسجَّل «ترحيلًا
                معلّقًا» حتى تُراجع.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!canEdit || !drained}
                onClick={() => {
                  actions?.confirmStockModeChange(userName);
                }}
              >
                تأكيد الوضع الجديد
              </Button>
              <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => actions?.cancelStockModeChange(userName)}>
                إلغاء التبديل
              </Button>
            </div>
          </div>
        ) : data.settings.stockMode === 'inventory' ? (
          <p className="text-xs text-muted-foreground">
            يحتاج تطبيق المخازن ووسيط «نقاط البيع ↔ المخازن» في الخلفية. حدّد مستودع كل نقطة بيع في «نقاط البيع والأجهزة».
          </p>
        ) : null}
        <Toggle
          label="الأصناف المتاحة في نقطة البيع فقط"
          hint="يعرض الأصناف المعلَّمة «متاح في نقطة البيع» في تطبيق المنتجات."
          checked={draft.onlyPosAvailableProducts}
          onChange={(v) => setDraft((d) => ({ ...d, onlyPosAvailableProducts: v }))}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="الضريبة" description="تُحفظ نسبتها ومبلغها على كل سطر بيع. الفوترة الإلكترونية تُضاف لكل دولة على حدة.">
          <Toggle label="تطبيق ضريبة على المبيعات" checked={draft.tax.enabled} onChange={(v) => set('tax', { enabled: v })} />
          {draft.tax.enabled ? (
            <>
              <NumberField label="النسبة" value={draft.tax.rate} onChange={(v) => set('tax', { rate: v })} suffix="%" />
              <Toggle label="الأسعار شاملة الضريبة" checked={draft.tax.pricesIncludeTax} onChange={(v) => set('tax', { pricesIncludeTax: v })} />
            </>
          ) : null}
        </Card>

        <Card title="الخصومات والأسعار">
          <NumberField
            label="أعلى خصم يمنحه الكاشير وحده"
            value={draft.discounts.cashierMaxPercent}
            onChange={(v) => set('discounts', { cashierMaxPercent: v })}
            suffix="%"
          />
          <Toggle
            label="موافقة مشرف فوق الحد"
            hint="وإلا يُرفض الخصم الأعلى."
            checked={draft.discounts.supervisorApprovalAbove}
            onChange={(v) => set('discounts', { supervisorApprovalAbove: v })}
          />
          <Toggle
            label="السماح بتغيير سعر الصنف"
            hint="لمن يملك صلاحية «تغيير سعر الصنف» فقط، ويُسجَّل."
            checked={draft.discounts.allowPriceOverride}
            onChange={(v) => set('discounts', { allowPriceOverride: v })}
          />
        </Card>

        <Card title="وسائل الدفع" description="البطاقة والتحويل تُسجَّل بمرجعها بعد تنفيذها على الجهاز أو الحساب.">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).map((m) => (
            <Toggle
              key={m}
              label={PAYMENT_METHOD_LABELS[m]}
              checked={draft.paymentMethods[m]}
              onChange={(v) => set('paymentMethods', { [m]: v })}
            />
          ))}
        </Card>

        <Card title="المرتجعات">
          <NumberField
            label="مدة قبول المرتجع"
            value={draft.returns.windowDays}
            onChange={(v) => set('returns', { windowDays: Math.max(0, Math.round(v)) })}
            suffix="يوم"
          />
          <Toggle
            label="الرد بوسيلة غير الأصلية يحتاج موافقة"
            checked={draft.returns.refundToOtherMethodNeedsApproval}
            onChange={(v) => set('returns', { refundToOtherMethodNeedsApproval: v })}
          />
        </Card>

        <Card title="الورديات والنقد">
          <Toggle
            label="عدّ أعمى عند الإغلاق"
            hint="لا يرى الكاشير المتوقع قبل إدخال المعدود."
            checked={draft.shifts.blindCount}
            onChange={(v) => set('shifts', { blindCount: v })}
          />
          <Toggle
            label="العدّ بالفئات"
            checked={draft.shifts.countByDenomination}
            onChange={(v) => set('shifts', { countByDenomination: v })}
          />
          <NumberField
            label="فرق مقبول بلا سبب"
            value={draft.shifts.differenceTolerance}
            onChange={(v) => set('shifts', { differenceTolerance: Math.max(0, v) })}
          />
          {draft.shifts.countByDenomination ? (
            <div className="space-y-1.5">
              <Label>الفئات (مفصولة بفواصل)</Label>
              <Input
                dir="ltr"
                className="h-9"
                value={draft.shifts.denominations.join(', ')}
                onChange={(e) =>
                  set('shifts', {
                    denominations: e.target.value
                      .split(',')
                      .map((x) => parseAmount(x))
                      .filter((x) => x > 0),
                  })
                }
              />
            </div>
          ) : null}
        </Card>

        <Card title="الطباعة" description="الإيصالات تُطبع بالقالب المعتمد في إعدادات الشركة.">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <span>
              القالب المعتمد: <b>{templateName}</b>
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/system/organization/pages/company">تغيير القالب</Link>
            </Button>
          </div>
        </Card>
      </div>

      {canEdit ? (
        <div className="sticky bottom-3 flex justify-end">
          <Button onClick={save} disabled={!dirty}>
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function PosSettingsPage() {
  return (
    <PosGate permission="pos.settings.manage">
      <Settings />
    </PosGate>
  );
}

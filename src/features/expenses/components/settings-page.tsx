'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/shared/currencies';
import { companyCurrencyKnown } from '@/features/auth/lib/company-currency';
import { cn } from '@/shared/utils';
import { useExpensesStore } from '../data/store';
import { exportJson, parseImport } from '../data/storage';
import { updateSettings } from '../domain/commands';
import { currenciesInUse } from '../domain/ledger';
import { minorToInput, type Minor } from '../domain/money';
import type { ExpensesSettings } from '../domain/types';
import { AmountInput, Field, LoadingBlock, PartyChecklist, Section } from './common';
import { todayIso, useCurrency, useExpensesData, useExpensesPermissions } from './expenses-provider';

function OptionalAmount({ label, hint, value, onChange }: { label: string; hint?: string; value: Minor | null; onChange: (v: Minor | null) => void }) {
  const currency = useCurrency();
  const [text, setText] = React.useState(value != null ? minorToInput(value, currency.decimals) : '');
  React.useEffect(() => setText(value != null ? minorToInput(value, currency.decimals) : ''), [value, currency.decimals]);
  return (
    <Field label={label} hint={hint ?? 'اتركه فارغاً لتعطيله.'}>
      <AmountInput value={text} placeholder="بلا حد" onChange={(t, m) => { setText(t); onChange(t.trim() ? m : null); }} />
    </Field>
  );
}

export function SettingsPage() {
  const data = useExpensesData();
  const run = useExpensesStore((s) => s.run);
  const replaceData = useExpensesStore((s) => s.replaceData);
  const reset = useExpensesStore((s) => s.reset);
  const sources = useExpensesStore((s) => s.sources);
  const saveFailed = useExpensesStore((s) => s.saveFailed);
  const currency = useCurrency();
  const perms = useExpensesPermissions();
  const fileRef = React.useRef<HTMLInputElement>(null);
  if (!data) return <LoadingBlock />;
  const s = data.settings;
  const patch = (p: Partial<ExpensesSettings>) => {
    run((d) => updateSettings(d, p));
    toast.success('حُفظ الإعداد');
  };
  const disabled = !perms.settings;
  const known = companyCurrencyKnown();
  const other = currenciesInUse(data, currency.code).filter((c) => c !== currency.code);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson(data)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-export-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      if (!window.confirm('سيستبدل الاستيراد بيانات هذا المتصفح لهذه الشركة. متابعة؟')) return;
      replaceData(imported);
      toast.success('استُوردت البيانات');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الاستيراد');
    }
  };

  return (
    <div className="space-y-4">
      <SetPageTitle titleAr="الإعدادات والسياسات" descriptionAr="مستوى الواجهة والاعتماد وحدود الصرف والبيانات" iconName="Settings" />
      {disabled ? <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">للعرض فقط: تعديل الإعدادات يحتاج صلاحية exp.settings.update.</p> : null}
      {saveFailed ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">تعذر الحفظ في المتصفح (وضع خاص أو امتلاء التخزين).</p> : null}

      <Section title="مستوى الواجهة" description="يغيّر الوظائف الظاهرة فقط — لا يغيّر الحسابات ولا يحذف بيانات.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(['simple', 'advanced'] as const).map((mode) => (
            <button key={mode} type="button" disabled={disabled} onClick={() => patch({ mode })} className={cn('rounded-xl border p-3 text-start transition-colors', s.mode === mode ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted')}>
              <p className="text-sm font-semibold">{mode === 'simple' ? 'بسيط' : 'متقدم'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{mode === 'simple' ? 'للأفراد والمنشآت الصغيرة: مصروفات وعهد وتقسيم وتسويات.' : 'يُظهر مراكز التكلفة وتوزيع التكلفة والسياسات والاعتمادات بالتفصيل.'}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="الاعتماد" description="العمليات تؤثر على الأرصدة بعد اعتمادها؛ المعلق يظهر منفصلاً.">
        <div className="flex items-center justify-between gap-3 py-1">
          <div><p className="text-sm font-medium">يتطلب اعتماداً</p><p className="text-xs text-muted-foreground">عند الإيقاف تُعتمد العمليات عند حفظها.</p></div>
          <Switch checked={s.requireApproval} disabled={disabled} onCheckedChange={(v) => patch({ requireApproval: v })} />
        </div>
        {s.requireApproval ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <OptionalAmount label="اعتماد تلقائي لما دون" value={s.autoApproveBelow} onChange={(v) => !disabled && patch({ autoApproveBelow: v })} />
            <Field label="المعتمِدون" hint="لا يعتمد أحد عملية سجّلها بنفسه."><PartyChecklist value={s.approverIds} onChange={(ids) => !disabled && patch({ approverIds: ids })} /></Field>
          </div>
        ) : null}
      </Section>

      {s.mode === 'advanced' ? (
        <Section title="السياسات وحدود الصرف" description="حدود الفئات تُضبط من صفحة الفئات.">
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionalAmount label="يلزم مرفق للمبالغ فوق" value={s.requireAttachmentAbove} onChange={(v) => !disabled && patch({ requireAttachmentAbove: v })} />
            <OptionalAmount label="الحد الشهري لمصروفات الشخص" value={s.monthlyLimitPerPerson} onChange={(v) => !disabled && patch({ monthlyLimitPerPerson: v })} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div><p className="text-sm font-medium">منع الإرسال عند مخالفة السياسة</p><p className="text-xs text-muted-foreground">عند الإيقاف تظهر تنبيهات فقط.</p></div>
            <Switch checked={s.blockOnPolicyViolation} disabled={disabled} onCheckedChange={(v) => patch({ blockOnPolicyViolation: v })} />
          </div>
        </Section>
      ) : null}

      <Section title="العملة" description="عملة الشركة الأساسية من إعدادات الشركة؛ تُحفظ العملة على كل عملية. تعدد العملات والتحويل مؤجل.">
        <div className="text-sm">العملة المستخدمة: <Badge variant="outline">{currency.code}</Badge> {known ? <span className="text-xs text-muted-foreground">(من إعدادات الشركة)</span> : <span className="text-xs text-warning">(عملة الشركة غير متاحة — إعداد تجريبي)</span>}</div>
        {!known ? (
          <div className="mt-2 max-w-xs">
            <Select value={s.fallbackCurrency} onValueChange={(v) => !disabled && patch({ fallbackCurrency: v })}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.nameAr} ({c.code})</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ) : null}
        {other.length > 0 ? <p className="mt-2 text-xs text-warning">توجد عمليات بعملات أخرى ({other.join('، ')}) لا تظهر في الأرصدة الحالية.</p> : null}
      </Section>

      <Section title="المشاركون" description="مستخدمو الشركة وجهات اتصالها الداخلية للقراءة فقط، والبيانات التجريبية احتياطاً.">
        <ul className="space-y-1 text-sm">
          <li>مستخدمو الشركة: <Badge variant={sources.users === 'live' ? 'success' : 'subtle'}>{sources.users === 'live' ? 'متصل' : sources.users === 'loading' ? 'جارٍ…' : 'غير متاح (صلاحية system.users.read)'}</Badge></li>
          <li>جهات الاتصال الداخلية: <Badge variant={sources.contacts === 'live' ? 'success' : 'subtle'}>{sources.contacts === 'live' ? 'متصل' : sources.contacts === 'loading' ? 'جارٍ…' : 'غير متاح (تطبيق جهات الاتصال / cnt.partners.read)'}</Badge></li>
          <li>مشاركون تجريبيون: {data.demoParticipants.length}</li>
        </ul>
      </Section>

      <Section title="البيانات (للاختبار)" description="محفوظة في هذا المتصفح فقط لهذه الشركة وهذا المستخدم.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}><Download className="me-1.5 h-4 w-4" />تصدير JSON</Button>
          <Button variant="outline" disabled={disabled} onClick={() => fileRef.current?.click()}><Upload className="me-1.5 h-4 w-4" />استيراد JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" className="sr-only" onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = ''; }} />
          <Button variant="outline" disabled={disabled} onClick={() => { if (window.confirm('إعادة البيانات التجريبية؟ ستُحذف بيانات هذا المتصفح ومرفقاته.')) { reset('demo', todayIso()); toast.success('أُعيدت البيانات التجريبية'); } }}><RefreshCw className="me-1.5 h-4 w-4" />إعادة البيانات التجريبية</Button>
          <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={disabled} onClick={() => { if (window.confirm('البدء ببيانات فارغة؟ ستُحذف بيانات هذا المتصفح ومرفقاته.')) { reset('empty', todayIso()); toast.success('بدأت ببيانات فارغة'); } }}><Trash2 className="me-1.5 h-4 w-4" />البدء فارغاً</Button>
        </div>
      </Section>
    </div>
  );
}

'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Archive, Pencil, Plus, RotateCcw } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpensesStore } from '../data/store';
import { upsertCategory, upsertCostCenter, upsertGroup } from '../domain/commands';
import { minorToInput, type Minor } from '../domain/money';
import type { Category, CostCenter, ExpenseGroup } from '../domain/types';
import { AmountInput, EmptyState, Field, FormDialog, LoadingBlock, Money, PartyChecklist, PartyName, Section } from './common';
import { useCurrency, useExpensesData, useExpensesPermissions } from './expenses-provider';

const COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#14b8a6', '#ef4444', '#6366f1', '#eab308', '#64748b', '#22c55e', '#ec4899'];
const newId = (p: string) => `${p}:${Math.random().toString(36).slice(2, 10)}`;

function CategoryDialog({ value, onClose }: { value: Category | 'new' | null; onClose: () => void }) {
  const run = useExpensesStore((s) => s.run);
  const currency = useCurrency();
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(COLORS[0]!);
  const [limit, setLimit] = React.useState<{ t: string; m: Minor }>({ t: '', m: 0 });
  React.useEffect(() => {
    if (!value) return;
    const c = value === 'new' ? null : value;
    setName(c?.name ?? '');
    setColor(c?.color ?? COLORS[0]!);
    setLimit(c?.maxAmount ? { t: minorToInput(c.maxAmount, currency.decimals), m: c.maxAmount } : { t: '', m: 0 });
  }, [value, currency.decimals]);
  if (!value) return null;
  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={value === 'new' ? 'فئة جديدة' : 'تعديل الفئة'} footer={<>
      <Button variant="outline" onClick={onClose}>إلغاء</Button>
      <Button disabled={!name.trim()} onClick={() => {
        const base: Category = value === 'new' ? { id: newId('cat'), name: '', color } : value;
        run((d) => upsertCategory(d, { ...base, name: name.trim(), color, maxAmount: limit.m > 0 ? limit.m : null }));
        toast.success('حُفظت الفئة');
        onClose();
      }}>حفظ</Button>
    </>}>
      <Field label="الاسم"><Input className="h-10" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="اللون">
        <div className="flex flex-wrap gap-2">{COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full border-2" style={{ backgroundColor: c, borderColor: color === c ? '#000' : 'transparent' }} />)}</div>
      </Field>
      <Field label="حد المصروف الواحد (سياسة، اختياري)" hint="المصروف فوق الحد يظهر تنبيهاً أو يُمنع حسب الإعدادات."><AmountInput value={limit.t} onChange={(t, m) => setLimit({ t, m })} /></Field>
    </FormDialog>
  );
}

function CostCenterDialog({ value, onClose }: { value: CostCenter | 'new' | null; onClose: () => void }) {
  const run = useExpensesStore((s) => s.run);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  React.useEffect(() => {
    if (!value) return;
    setCode(value === 'new' ? '' : value.code);
    setName(value === 'new' ? '' : value.name);
  }, [value]);
  if (!value) return null;
  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={value === 'new' ? 'مركز تكلفة جديد' : 'تعديل مركز التكلفة'} footer={<>
      <Button variant="outline" onClick={onClose}>إلغاء</Button>
      <Button disabled={!code.trim() || !name.trim()} onClick={() => {
        const base: CostCenter = value === 'new' ? { id: newId('cc'), code: '', name: '' } : value;
        run((d) => upsertCostCenter(d, { ...base, code: code.trim(), name: name.trim() }));
        toast.success('حُفظ المركز');
        onClose();
      }}>حفظ</Button>
    </>}>
      <Field label="الرمز"><Input className="h-10" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CC-400" /></Field>
      <Field label="الاسم"><Input className="h-10" value={name} onChange={(e) => setName(e.target.value)} /></Field>
    </FormDialog>
  );
}

function GroupDialog({ value, onClose }: { value: ExpenseGroup | 'new' | null; onClose: () => void }) {
  const run = useExpensesStore((s) => s.run);
  const data = useExpensesData();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [members, setMembers] = React.useState<string[]>([]);
  const [costCenterId, setCostCenterId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!value) return;
    const g = value === 'new' ? null : value;
    setName(g?.name ?? '');
    setDescription(g?.description ?? '');
    setMembers(g?.memberIds ?? []);
    setCostCenterId(g?.costCenterId ?? null);
  }, [value]);
  if (!value || !data) return null;
  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={value === 'new' ? 'مجموعة جديدة' : 'تعديل المجموعة'} description="رحلة أو مشروع أو مصاريف مشتركة: أعضاؤها يُقترحون عند تقسيم مصروفاتها." footer={<>
      <Button variant="outline" onClick={onClose}>إلغاء</Button>
      <Button disabled={!name.trim()} onClick={() => {
        const base: ExpenseGroup = value === 'new' ? { id: newId('grp'), name: '', memberIds: [] } : value;
        run((d) => upsertGroup(d, { ...base, name: name.trim(), description: description.trim() || null, memberIds: members, costCenterId }));
        toast.success('حُفظت المجموعة');
        onClose();
      }}>حفظ</Button>
    </>}>
      <Field label="الاسم"><Input className="h-10" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="الوصف"><Input className="h-10" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="الأعضاء"><PartyChecklist value={members} onChange={setMembers} /></Field>
      {data.settings.mode === 'advanced' ? (
        <Field label="مركز التكلفة الافتراضي">
          <Select value={costCenterId ?? 'none'} onValueChange={(v) => setCostCenterId(v === 'none' ? null : v)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بلا مركز</SelectItem>
              {data.costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </FormDialog>
  );
}

export function SetupPage() {
  const data = useExpensesData();
  const run = useExpensesStore((s) => s.run);
  const perms = useExpensesPermissions();
  const [cat, setCat] = React.useState<Category | 'new' | null>(null);
  const [cc, setCc] = React.useState<CostCenter | 'new' | null>(null);
  const [grp, setGrp] = React.useState<ExpenseGroup | 'new' | null>(null);
  if (!data) return <LoadingBlock />;
  const advanced = data.settings.mode === 'advanced';
  const expenses = data.expenses;
  const used = (pred: (e: (typeof expenses)[number]) => boolean) => expenses.filter(pred).length;
  const editBtn = (onClick: () => void) => perms.setup ? <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="تعديل" onClick={onClick}><Pencil className="h-4 w-4" /></Button> : null;
  const archiveBtn = (archived: boolean | undefined, onClick: () => void) => perms.setup ? <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={archived ? 'استعادة' : 'أرشفة'} onClick={onClick}>{archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button> : null;

  return (
    <div className="space-y-3">
      <SetPageTitle titleAr="الفئات والمجموعات ومراكز التكلفة" descriptionAr="تصنيف المصروفات وتوزيعها" iconName="LayoutGrid" />
      <Tabs defaultValue="categories">
        <TabsList className={advanced ? 'grid w-full grid-cols-3 sm:inline-flex sm:w-auto' : 'grid w-full grid-cols-2 sm:inline-flex sm:w-auto'}>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="groups">المجموعات</TabsTrigger>
          {advanced ? <TabsTrigger value="centers">مراكز التكلفة</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="categories" className="mt-3">
          <Section title="الفئات" actions={perms.setup ? <Button size="sm" onClick={() => setCat('new')}><Plus className="me-1 h-4 w-4" />فئة</Button> : undefined}>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    <div className="min-w-0">
                      <p className={c.archived ? 'truncate text-sm text-muted-foreground line-through' : 'truncate text-sm font-medium'}>{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{used((e) => e.categoryId === c.id)} مصروف{c.maxAmount ? <> · حد <Money value={c.maxAmount} /></> : null}</p>
                    </div>
                  </div>
                  <div className="flex">{editBtn(() => setCat(c))}{archiveBtn(c.archived, () => run((d) => upsertCategory(d, { ...c, archived: !c.archived })))}</div>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>
        <TabsContent value="groups" className="mt-3">
          <Section title="المجموعات" actions={perms.setup ? <Button size="sm" onClick={() => setGrp('new')}><Plus className="me-1 h-4 w-4" />مجموعة</Button> : undefined}>
            {data.groups.length === 0 ? <EmptyState text="لا مجموعات" /> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.groups.map((g) => (
                  <li key={g.id} className="space-y-1.5 rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><div className="truncate text-sm font-medium">{g.name}{g.closed ? <Badge variant="subtle" className="ms-1.5 text-[10px]">مغلقة</Badge> : null}</div>{g.description ? <p className="text-xs text-muted-foreground">{g.description}</p> : null}</div>
                      <div className="flex">{editBtn(() => setGrp(g))}{archiveBtn(g.closed, () => run((d) => upsertGroup(d, { ...g, closed: !g.closed })))}</div>
                    </div>
                    <p className="text-xs">{g.memberIds.length === 0 ? 'بلا أعضاء' : g.memberIds.map((m, i) => <React.Fragment key={m}>{i > 0 ? '، ' : ''}<PartyName id={m} /></React.Fragment>)}</p>
                    <p className="text-[11px] text-muted-foreground">{used((e) => e.groupId === g.id)} مصروف</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>
        {advanced ? (
          <TabsContent value="centers" className="mt-3">
            <Section title="مراكز التكلفة" description="للتوزيع التحليلي والتقارير — لا تنشئ ديوناً" actions={perms.setup ? <Button size="sm" onClick={() => setCc('new')}><Plus className="me-1 h-4 w-4" />مركز</Button> : undefined}>
              {data.costCenters.length === 0 ? <EmptyState text="لا مراكز تكلفة" /> : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {data.costCenters.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                      <div className="min-w-0"><p className={c.archived ? 'text-sm text-muted-foreground line-through' : 'text-sm font-medium'}><span dir="ltr" className="text-muted-foreground">{c.code}</span> {c.name}</p><p className="text-[11px] text-muted-foreground">{used((e) => e.allocation.some((a) => a.costCenterId === c.id))} مصروف</p></div>
                      <div className="flex">{editBtn(() => setCc(c))}{archiveBtn(c.archived, () => run((d) => upsertCostCenter(d, { ...c, archived: !c.archived })))}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </TabsContent>
        ) : null}
      </Tabs>
      <CategoryDialog value={cat} onClose={() => setCat(null)} />
      <CostCenterDialog value={cc} onClose={() => setCc(null)} />
      <GroupDialog value={grp} onClose={() => setGrp(null)} />
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, HandCoins } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { partyBalance, statement } from '../domain/ledger';
import { ORG } from '../domain/types';
import { expensesRoutes } from '../constants/routes';
import { EmptyState, LoadingBlock, Money, PartyName, ResponsiveTable, Section, SourceBadge, StatusBadge } from './common';
import { txnHref, txnTitle } from './dashboard-page';
import { useCurrency, useDirectory, useExpensesData, useExpensesPermissions, useLedger } from './expenses-provider';
import { SettlementDialog } from './settlements-page';

export function PeoplePage() {
  const data = useExpensesData();
  const ledger = useLedger();
  const directory = useDirectory();
  const router = useRouter();
  if (!data || !ledger) return <LoadingBlock />;
  const rows = directory.all
    .map((p) => ({ p, b: partyBalance(ledger, p.id) }))
    .sort((a, b) => b.b.entitlements + b.b.liabilities + b.b.custodyActual - (a.b.entitlements + a.b.liabilities + a.b.custodyActual));
  const org = partyBalance(ledger, ORG);
  return (
    <div className="space-y-3">
      <SetPageTitle titleAr="حسابات الأشخاص" descriptionAr="لكل مشارك: ما له، وما عليه، وعهدته — منفصلة" iconName="Users" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-3 text-xs"><p className="text-muted-foreground">على المنشأة للأشخاص</p><Money value={org.liabilities} className="text-base font-bold text-destructive" /></div>
        <div className="rounded-2xl border border-border bg-card p-3 text-xs"><p className="text-muted-foreground">للمنشأة على الأشخاص</p><Money value={org.entitlements} className="text-base font-bold text-success" /></div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-3 text-xs sm:col-span-1"><p className="text-muted-foreground">عهد لدى الأشخاص</p><Money value={[...ledger.custodies.values()].reduce((t, c) => t + c.actual, 0)} className="text-base font-bold text-primary" /></div>
      </div>
      {rows.length === 0 ? <EmptyState text="لا مشاركين" /> : (
        <ResponsiveTable
          rows={rows}
          rowKey={(r) => r.p.id}
          onRowClick={(r) => router.push(expensesRoutes.personDetail(r.p.id))}
          card={({ p, b }) => (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5"><p className="text-sm font-medium">{p.name}</p><SourceBadge id={p.id} /></div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div className="rounded-lg bg-success/10 p-1.5"><p className="text-muted-foreground">له</p><Money value={b.entitlements} className="font-semibold text-success" /></div>
                <div className="rounded-lg bg-destructive/10 p-1.5"><p className="text-muted-foreground">عليه</p><Money value={b.liabilities} className="font-semibold text-destructive" /></div>
                <div className="rounded-lg bg-primary/10 p-1.5"><p className="text-muted-foreground">عهدة</p><Money value={b.custodyActual} className="font-semibold text-primary" /></div>
              </div>
            </div>
          )}
          columns={[
            { header: 'المشارك', cell: ({ p }) => <span className="inline-flex flex-wrap items-center gap-1.5 font-medium">{p.name}<SourceBadge id={p.id} /></span> },
            { header: 'له (مستحقات)', cell: ({ b }) => <Money value={b.entitlements} className="text-success" /> },
            { header: 'عليه (التزامات)', cell: ({ b }) => <Money value={b.liabilities} className="text-destructive" /> },
            { header: 'العهدة الفعلية', cell: ({ b }) => <Money value={b.custodyActual} /> },
            { header: 'العهدة المتوقعة', cell: ({ b }) => <Money value={b.custodyExpected} className={b.custodyExpected !== b.custodyActual ? 'text-warning' : ''} /> },
          ]}
        />
      )}
    </div>
  );
}

export function PersonDetailPage({ id }: { id: string }) {
  const data = useExpensesData();
  const ledger = useLedger();
  const currency = useCurrency();
  const directory = useDirectory();
  const perms = useExpensesPermissions();
  const router = useRouter();
  const [settle, setSettle] = React.useState<{ fromId: string; toId: string; amount: number } | null>(null);
  if (!data || !ledger) return <LoadingBlock />;
  const person = directory.get(id);
  if (!person) return <EmptyState text="المشارك غير موجود" />;
  const b = partyBalance(ledger, id);
  const lines = statement(data, id, currency.code).reverse();
  const custodies = [...ledger.custodies.values()].filter((c) => c.custody.holderId === id);

  return (
    <div className="space-y-4">
      <SetPageTitle titleAr={person.name} descriptionAr="كشف حساب المشارك" iconName="Users" />
      <Button variant="ghost" size="sm" asChild><Link href={expensesRoutes.people}><ArrowRight className="me-1 h-4 w-4" />حسابات الأشخاص</Link></Button>
      <div className="flex flex-wrap items-center gap-1.5"><SourceBadge id={id} /><span className="text-xs text-muted-foreground">{person.kind === 'user_contact' ? 'مستخدم وجهة اتصال' : person.kind === 'user' ? 'مستخدم' : 'جهة اتصال داخلية'}</span></div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">له (مستحقات)</p><Money value={b.entitlements} className="text-sm font-bold text-success sm:text-lg" /></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">عليه (التزامات)</p><Money value={b.liabilities} className="text-sm font-bold text-destructive sm:text-lg" /></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">العهدة</p><Money value={b.custodyActual} className="text-sm font-bold text-primary sm:text-lg" />{b.custodyExpected !== b.custodyActual ? <p className="text-[10px] text-warning">متوقع <Money value={b.custodyExpected} /></p> : null}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="مع كل طرف" description="بعد المقاصة بين الطرفين فقط">
          {b.pairs.length === 0 ? <EmptyState text="لا مستحقات" /> : (
            <ul className="divide-y divide-border">
              {b.pairs.map((pair) => (
                <li key={pair.counterparty} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <PartyName id={pair.counterparty} />
                    <p className="text-[11px] text-muted-foreground">{pair.net > 0 ? 'عليه له' : 'له عليه'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Money value={Math.abs(pair.net)} className={pair.net > 0 ? 'font-semibold text-destructive' : 'font-semibold text-success'} />
                    {perms.settle ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="تسوية" onClick={() => setSettle(pair.net > 0 ? { fromId: id, toId: pair.counterparty, amount: pair.net } : { fromId: pair.counterparty, toId: id, amount: -pair.net })}>
                        <HandCoins className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {custodies.length > 0 ? (
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium">العهد التي يحملها</p>
              {custodies.map((c) => (
                <Link key={c.custody.id} href={expensesRoutes.custodyDetail(c.custody.id)} className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <span className="truncate">{c.custody.purpose}</span><Money value={c.actual} className="font-semibold" />
                </Link>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="كشف الحساب" description="له يزيد ما يستحقه، عليه يزيد ما يلتزم به؛ المعلق لا يحرك الرصيد" className="lg:col-span-2">
          {lines.length === 0 ? <EmptyState text="لا حركات" /> : (
            <ResponsiveTable
              rows={lines}
              rowKey={(l) => l.txn.kind + l.txn.id}
              onRowClick={(l) => router.push(txnHref(l.txn))}
              card={(l) => (
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm">{txnTitle(l.txn, directory.nameOf)}</p>
                    {l.pending ? <StatusBadge status={l.txn.status} /> : null}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs">
                    <span className="text-muted-foreground">{l.txn.date}</span>
                    {l.credit ? <span className="text-success">له <Money value={l.credit} /></span> : null}
                    {l.debit ? <span className="text-destructive">عليه <Money value={l.debit} /></span> : null}
                    {l.custody ? <span className="text-primary">عهدة <Money value={l.custody} signed /></span> : null}
                  </div>
                  {!l.pending ? <p className="text-[11px] text-muted-foreground">الصافي بعدها <Money value={l.balance} /> · العهدة <Money value={l.custodyBalance} /></p> : null}
                </div>
              )}
              columns={[
                { header: 'التاريخ', cell: (l) => <span className="tabular-nums">{l.txn.date}</span> },
                { header: 'البيان', cell: (l) => <span className="inline-flex items-center gap-1.5">{txnTitle(l.txn, directory.nameOf)}{l.pending ? <StatusBadge status={l.txn.status} /> : null}</span> },
                { header: 'له', cell: (l) => (l.credit ? <Money value={l.credit} className="text-success" /> : '—') },
                { header: 'عليه', cell: (l) => (l.debit ? <Money value={l.debit} className="text-destructive" /> : '—') },
                { header: 'العهدة', cell: (l) => (l.custody ? <Money value={l.custody} signed /> : '—') },
                { header: 'الصافي', cell: (l) => (l.pending ? <span className="text-xs text-muted-foreground">معلق</span> : <Money value={l.balance} className="font-medium" />) },
              ]}
            />
          )}
        </Section>
      </div>
      <SettlementDialog open={settle !== null} onOpenChange={(o) => !o && setSettle(null)} preset={settle} />
    </div>
  );
}


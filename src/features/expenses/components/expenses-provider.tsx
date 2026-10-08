'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { companyCurrencyKnown, useCompanyCurrency } from '@/features/auth/lib/company-currency';
import { useCan } from '@/features/auth/hooks/use-can';
import { useExpensesStore } from '../data/store';
import { scopeKey } from '../data/storage';
import { loadLiveParticipants } from '../data/participants-source';
import { userParticipantId } from '../domain/participants';
import { computeLedger, type Ledger } from '../domain/ledger';
import { currencySpec, formatMoney, type CurrencySpec, type Minor } from '../domain/money';
import { ORG } from '../domain/types';
import type { ExpensesData, Participant, PartyId } from '../domain/types';
import { EXP } from '../constants/permissions';

export const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Sets up the app for the active company and user: local data slot, base
 * currency, live participants (with sample fallback) and the simulated actor.
 */
export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const companyCurrency = useCompanyCurrency();
  const init = useExpensesStore((s) => s.init);
  const setLive = useExpensesStore((s) => s.setLive);
  const setCurrency = useExpensesStore((s) => s.setCurrency);
  const data = useExpensesStore((s) => s.data);

  const authUser = useAuthStore((s) => s.user);
  const userId = accessProfile?.userId ?? null;
  const currentUser = React.useMemo(() => {
    if (!userId) return null;
    const name = authUser?.fullNameAr?.trim() || authUser?.fullNameEn?.trim() || authUser?.email || accessProfile?.email || 'أنا';
    return { id: userId, name, email: authUser?.email ?? accessProfile?.email ?? null };
  }, [userId, authUser, accessProfile?.email]);

  const known = companyCurrencyKnown();
  React.useEffect(() => {
    if (!companyId || !userId) return;
    init({
      scope: scopeKey(companyId, userId),
      currency: known ? companyCurrency : 'YER',
      today: todayIso(),
      approverId: userParticipantId(userId),
    });
  }, [companyId, userId, companyCurrency, known, init]);

  // The company currency wins; without it, the data's fallback (a test setting).
  React.useEffect(() => {
    if (!data) return;
    setCurrency(known ? companyCurrency : data.settings.fallbackCurrency);
  }, [data, known, companyCurrency, setCurrency]);

  React.useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setLive([], { users: 'loading', contacts: 'loading' });
    void loadLiveParticipants(companyId, currentUser).then((res) => {
      if (!cancelled) setLive(res.participants, { users: res.users, contacts: res.contacts });
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, currentUser, setLive]);

  return <>{children}</>;
}

/** The data, or null while loading. */
export function useExpensesData(): ExpensesData | null {
  return useExpensesStore((s) => s.data);
}

export function useCurrency(): CurrencySpec & { format: (minor: Minor) => string } {
  const code = useExpensesStore((s) => s.currency);
  return React.useMemo(() => {
    const spec = currencySpec(code);
    return { ...spec, format: (minor: Minor) => formatMoney(minor, spec) };
  }, [code]);
}

export function useLedger(): Ledger | null {
  const data = useExpensesData();
  const currency = useExpensesStore((s) => s.currency);
  return React.useMemo(() => (data ? computeLedger(data, currency) : null), [data, currency]);
}

export type Directory = {
  all: Participant[];
  /** Active participants to choose from (live first, then samples). */
  choices: Participant[];
  nameOf: (id: PartyId | null | undefined) => string;
  get: (id: PartyId) => Participant | undefined;
};

export function useDirectory(): Directory {
  const live = useExpensesStore((s) => s.liveParticipants);
  const data = useExpensesData();
  return React.useMemo(() => {
    const all = [...live, ...(data?.demoParticipants ?? [])];
    const byId = new Map(all.map((p) => [p.id, p]));
    return {
      all,
      choices: all.filter((p) => p.active),
      get: (id) => byId.get(id),
      nameOf: (id) => (id === ORG ? 'المنشأة' : id ? (byId.get(id)?.name ?? (id === 'auto' ? 'اعتماد تلقائي' : 'غير معروف')) : '—'),
    };
  }, [live, data?.demoParticipants]);
}

/** Real ERP permissions (exp.*) of the signed-in user — not the simulated actor. */
export function useExpensesPermissions() {
  const can = useCan();
  return React.useMemo(
    () => ({
      create: can(EXP.expensesCreate),
      approve: can(EXP.expensesApprove),
      void: can(EXP.expensesVoid),
      custody: can(EXP.custodyManage),
      settle: can(EXP.settlementsCreate),
      reports: can(EXP.reportsRead),
      setup: can(EXP.setupManage),
      settings: can(EXP.settingsUpdate),
    }),
    [can],
  );
}

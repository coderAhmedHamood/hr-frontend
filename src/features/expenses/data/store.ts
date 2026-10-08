'use client';

/**
 * Client store of the prototype: the current scope's data, the simulated
 * actor ("act as"), and live participants. Operations go through `run`, which
 * applies a pure command (domain/commands) and saves the result locally.
 */
import { create } from 'zustand';
import type { Ctx } from '../domain/commands';
import type { ExpensesData, Participant } from '../domain/types';
import { buildDemoData, emptyData } from './demo-seed';
import type { SourceState } from './participants-source';
import { clearData, loadData, saveData } from './storage';
import { clearScopeFiles } from './attachments';

type Sources = { users: SourceState | 'loading'; contacts: SourceState | 'loading' };

type ExpensesState = {
  scope: string | null;
  data: ExpensesData | null;
  /** Simulated actor (participant id) — prototype only. */
  actorId: string | null;
  /** Effective currency: the company's, else the data's fallback setting. */
  currency: string;
  liveParticipants: Participant[];
  sources: Sources;
  saveFailed: boolean;

  init: (args: { scope: string; currency: string; today: string; approverId: string | null }) => void;
  setCurrency: (currency: string) => void;
  setLive: (participants: Participant[], sources: Sources) => void;
  setActor: (actorId: string) => void;
  /** Applies an operation; throws CommandError with an Arabic message. */
  run: <R extends ExpensesData | { data: ExpensesData }>(fn: (data: ExpensesData, ctx: Ctx) => R) => R;
  replaceData: (data: ExpensesData) => void;
  reset: (kind: 'demo' | 'empty', today: string) => void;
};

const newId = (prefix: string) =>
  `${prefix}:${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14)}`;

export const useExpensesStore = create<ExpensesState>((set, get) => {
  const persist = (data: ExpensesData) => {
    const scope = get().scope;
    const ok = scope ? saveData(scope, data) : true;
    set({ data, saveFailed: !ok });
  };

  return {
    scope: null,
    data: null,
    actorId: null,
    currency: 'YER',
    liveParticipants: [],
    sources: { users: 'loading', contacts: 'loading' },
    saveFailed: false,

    init: ({ scope, currency, today, approverId }) => {
      if (get().scope === scope && get().data) return;
      let data = loadData(scope);
      if (!data) {
        data = buildDemoData(currency, today);
        // The signed-in user approves too, so the sample approvals can be tried.
        if (approverId && !data.settings.approverIds.includes(approverId)) {
          data = { ...data, settings: { ...data.settings, approverIds: [...data.settings.approverIds, approverId] } };
        }
        saveData(scope, data);
      }
      set({ scope, data, currency, actorId: approverId ?? data.settings.approverIds[0] ?? null });
    },
    setCurrency: (currency) => set({ currency }),
    setLive: (liveParticipants, sources) => set({ liveParticipants, sources }),
    setActor: (actorId) => set({ actorId }),

    run: (fn) => {
      const { data, actorId, currency } = get();
      if (!data || !actorId) throw new Error('البيانات غير جاهزة');
      const result = fn(data, { actorId, currency, now: new Date().toISOString(), newId });
      persist('version' in result ? (result as ExpensesData) : (result as { data: ExpensesData }).data);
      return result;
    },

    replaceData: (data) => persist(data),

    reset: (kind, today) => {
      const { scope, currency, actorId } = get();
      if (!scope) return;
      clearData(scope);
      void clearScopeFiles(scope).catch(() => undefined);
      let data = kind === 'demo' ? buildDemoData(currency, today) : emptyData(currency);
      if (actorId?.startsWith('u:')) {
        data = { ...data, settings: { ...data.settings, approverIds: [...new Set([...data.settings.approverIds, actorId])] } };
      }
      persist(data);
    },
  };
});

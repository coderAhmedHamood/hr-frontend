'use client';

/**
 * Client store of the expenses app: the company's data as the server sends it
 * (`GET /expenses/data`), the signed-in user as a party (`actorId`), the
 * company currency and the participants. Every operation is a command run by
 * the server (`POST /expenses/commands`) with the same domain rules and its
 * own `exp.*` permission; the screens get the updated data back.
 */
import { create } from 'zustand';
import { ApiError, apiRequest } from '@/shared/api/client';
import type { ExpensesData, Participant } from '../domain/types';
import type { ExpensesCommand } from './commands';

type SourceState = 'loading' | 'live' | 'unavailable';

type ExpensesView = ExpensesData & { actorId: string; currency: string };

type ExpensesState = {
  companyId: string | null;
  data: ExpensesData | null;
  /** The signed-in user as a party (`u:<userId>`). */
  actorId: string | null;
  /** The company's base currency (balances and new records). */
  currency: string;
  liveParticipants: Participant[];
  participants: SourceState;
  loadError: string | null;
  /** True while a command runs (buttons wait for it). */
  busy: boolean;

  init: (companyId: string) => Promise<void>;
  reload: () => Promise<void>;
  /** Runs an operation on the server; throws an Error with the Arabic reason. */
  exec: <R = unknown>(command: ExpensesCommand) => Promise<R>;
};

/** The server's refusal (Arabic) or a generic message. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'ليست لديك صلاحية لهذا الإجراء.';
    return err.message || 'تعذر التنفيذ';
  }
  return err instanceof Error ? err.message : 'تعذر التنفيذ';
}

export const useExpensesStore = create<ExpensesState>((set, get) => {
  const apply = (view: ExpensesView) => {
    const { actorId, currency, ...data } = view;
    set({ data, actorId, currency });
  };

  const load = async (companyId: string) => {
    try {
      const view = await apiRequest<ExpensesView>('/expenses/data', {
        query: { companyId },
        silent: true,
        throwOnError: true,
      });
      if (get().companyId === companyId) {
        apply(view);
        set({ loadError: null });
      }
    } catch (err) {
      if (get().companyId === companyId) set({ loadError: errorMessage(err) });
    }
  };

  const loadParticipants = async (companyId: string) => {
    try {
      const list = await apiRequest<Participant[]>('/expenses/participants', {
        query: { companyId },
        silent: true,
        throwOnError: true,
      });
      if (get().companyId === companyId) {
        set({ liveParticipants: Array.isArray(list) ? list : [], participants: 'live' });
      }
    } catch {
      if (get().companyId === companyId) set({ liveParticipants: [], participants: 'unavailable' });
    }
  };

  return {
    companyId: null,
    data: null,
    actorId: null,
    currency: 'YER',
    liveParticipants: [],
    participants: 'loading',
    loadError: null,
    busy: false,

    init: async (companyId) => {
      if (get().companyId === companyId && get().data) return;
      set({
        companyId,
        data: null,
        actorId: null,
        loadError: null,
        liveParticipants: [],
        participants: 'loading',
      });
      await Promise.all([load(companyId), loadParticipants(companyId)]);
    },

    reload: async () => {
      const companyId = get().companyId;
      if (companyId) await load(companyId);
    },

    exec: async <R,>(command: ExpensesCommand): Promise<R> => {
      const companyId = get().companyId;
      if (!companyId) throw new Error('البيانات غير جاهزة');
      set({ busy: true });
      try {
        const res = await apiRequest<{ data: ExpensesView; result: R }>('/expenses/commands', {
          method: 'POST',
          body: { companyId, command },
          silent: true,
          throwOnError: true,
        });
        if (get().companyId === companyId) apply(res.data);
        return res.result;
      } catch (err) {
        throw new Error(errorMessage(err));
      } finally {
        set({ busy: false });
      }
    },
  };
});

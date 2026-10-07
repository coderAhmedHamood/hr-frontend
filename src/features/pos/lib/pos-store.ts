'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_POS_SETTINGS,
  type PosAuditEvent,
  type PosCashMovement,
  type PosCustomer,
  type PosDevice,
  type PosDiscount,
  type PosHeldCart,
  type PosPayment,
  type PosRegister,
  type PosReturn,
  type PosSale,
  type PosSaleLine,
  type PosSaleTotals,
  type PosSession,
  type PosSettings,
  type PosStockMode,
} from '@/features/pos/domain/types';

/**
 * Front-end store for the point of sale while the design settles.
 *
 * Everything is kept per company in browser storage. Each action mirrors an
 * endpoint the backend will expose, so swapping this for API calls keeps the
 * screens as they are. Nothing here touches inventory or money for real.
 */

export type PosCompanyData = {
  settings: PosSettings;
  registers: PosRegister[];
  devices: PosDevice[];
  sessions: PosSession[];
  sales: PosSale[];
  returns: PosReturn[];
  cashMovements: PosCashMovement[];
  heldCarts: PosHeldCart[];
  audit: PosAuditEvent[];
  returnSequence: number;
};

export const EMPTY_POS_DATA: PosCompanyData = {
  settings: DEFAULT_POS_SETTINGS,
  registers: [],
  devices: [],
  sessions: [],
  sales: [],
  returns: [],
  cashMovements: [],
  heldCarts: [],
  audit: [],
  returnSequence: 1,
};

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const now = () => new Date().toISOString();

type Mutator = (data: PosCompanyData) => PosCompanyData;

type PosState = {
  companies: Record<string, PosCompanyData>;
  mutate: (companyId: string, fn: Mutator) => void;
};

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      companies: {},
      mutate: (companyId, fn) =>
        set((state) => {
          const current = withDefaults(state.companies[companyId]);
          return { companies: { ...state.companies, [companyId]: fn(current) } };
        }),
    }),
    { name: 'erp.pos.v1', storage: createJSONStorage(() => localStorage) },
  ),
);

function withDefaults(data: PosCompanyData | undefined): PosCompanyData {
  if (!data) return EMPTY_POS_DATA;
  return {
    ...EMPTY_POS_DATA,
    ...data,
    settings: {
      ...DEFAULT_POS_SETTINGS,
      ...data.settings,
      tax: { ...DEFAULT_POS_SETTINGS.tax, ...data.settings?.tax },
      discounts: { ...DEFAULT_POS_SETTINGS.discounts, ...data.settings?.discounts },
      returns: { ...DEFAULT_POS_SETTINGS.returns, ...data.settings?.returns },
      shifts: { ...DEFAULT_POS_SETTINGS.shifts, ...data.settings?.shifts },
      paymentMethods: { ...DEFAULT_POS_SETTINGS.paymentMethods, ...data.settings?.paymentMethods },
    },
  };
}

export function usePosData(companyId: string | null | undefined): PosCompanyData {
  const data = usePosStore((s) => (companyId ? s.companies[companyId] : undefined));
  return withDefaults(data);
}

function audit(data: PosCompanyData, by: string, type: PosAuditEvent['type'], detail: string): PosCompanyData {
  return { ...data, audit: [{ id: newId(), at: now(), by, type, detail }, ...data.audit].slice(0, 500) };
}

function updateSale(data: PosCompanyData, saleId: string, fn: (sale: PosSale) => PosSale): PosCompanyData {
  return { ...data, sales: data.sales.map((s) => (s.id === saleId ? fn(s) : s)) };
}

/** Actions bound to one company; each is one future API call. */
export function posActions(companyId: string) {
  const mutate = (fn: Mutator) => usePosStore.getState().mutate(companyId, fn);
  const read = () => withDefaults(usePosStore.getState().companies[companyId]);

  return {
    saveSettings(settings: PosSettings) {
      mutate((d) => ({ ...d, settings }));
    },

    saveRegister(input: Omit<PosRegister, 'id' | 'createdAt' | 'nextSequence'> & { id?: string }) {
      const id = input.id ?? newId();
      mutate((d) => {
        const existing = d.registers.find((r) => r.id === id);
        const register: PosRegister = existing
          ? { ...existing, ...input, id }
          : { ...input, id, nextSequence: 1, createdAt: now() };
        return {
          ...d,
          registers: existing ? d.registers.map((r) => (r.id === id ? register : r)) : [...d.registers, register],
        };
      });
      return id;
    },

    pairDevice(registerId: string, label: string, by: string) {
      const id = newId();
      mutate((d) =>
        audit(
          { ...d, devices: [...d.devices, { id, registerId, label, pairedAt: now(), revokedAt: null }] },
          by,
          'device_paired',
          label,
        ),
      );
      return id;
    },

    revokeDevice(deviceId: string, by: string) {
      mutate((d) =>
        audit(
          { ...d, devices: d.devices.map((x) => (x.id === deviceId ? { ...x, revokedAt: now() } : x)) },
          by,
          'device_revoked',
          deviceId,
        ),
      );
    },

    openSession(registerId: string, cashierId: string, cashierName: string, openingFloat: number, stockMode: PosStockMode) {
      const id = newId();
      mutate((d) => ({
        ...d,
        sessions: [
          ...d.sessions,
          {
            id,
            registerId,
            cashierId,
            cashierName,
            status: 'open',
            stockMode,
            openedAt: now(),
            openingFloat,
            closedAt: null,
            countedCash: null,
            expectedCash: null,
            difference: null,
            differenceReason: null,
            denominationCounts: null,
          },
        ],
      }));
      return id;
    },

    closeSession(
      sessionId: string,
      result: {
        countedCash: number;
        expectedCash: number;
        difference: number;
        differenceReason: string | null;
        denominationCounts: Record<string, number> | null;
      },
      by: string,
    ) {
      mutate((d) => {
        let next: PosCompanyData = {
          ...d,
          sessions: d.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...result, status: 'closed', closedAt: now() } : s,
          ),
        };
        if (result.difference !== 0) {
          next = audit(next, by, 'shift_difference', `${result.difference} — ${result.differenceReason ?? ''}`);
        }
        return next;
      });
    },

    addCashMovement(sessionId: string, type: 'in' | 'out', amount: number, reason: string, by: string) {
      mutate((d) =>
        audit(
          {
            ...d,
            cashMovements: [
              ...d.cashMovements,
              { id: newId(), sessionId, type, amount, reason, createdAt: now(), createdBy: by },
            ],
          },
          by,
          'cash_movement',
          `${type === 'in' ? 'قبض' : 'صرف'} ${amount} — ${reason}`,
        ),
      );
    },

    holdCart(cart: Omit<PosHeldCart, 'id' | 'createdAt'>) {
      mutate((d) => ({ ...d, heldCarts: [...d.heldCarts, { ...cart, id: newId(), createdAt: now() }] }));
    },

    dropHeldCart(id: string) {
      mutate((d) => ({ ...d, heldCarts: d.heldCarts.filter((c) => c.id !== id) }));
    },

    voidCart(by: string, itemCount: number, value: number) {
      mutate((d) => audit(d, by, 'cart_voided', `${itemCount} صنف بقيمة ${value}`));
    },

    logAudit(by: string, type: PosAuditEvent['type'], detail: string) {
      mutate((d) => audit(d, by, type, detail));
    },

    /** Commit the cart: prices and snapshot fixed, stock reserved when linked. */
    commitSale(input: {
      registerId: string;
      sessionId: string;
      cashierName: string;
      stockSource: PosStockMode;
      customer: PosCustomer;
      lines: PosSaleLine[];
      orderDiscount: PosDiscount | null;
      totals: PosSaleTotals;
    }) {
      const id = newId();
      mutate((d) => ({
        ...d,
        sales: [
          {
            ...input,
            id,
            number: null,
            status: 'awaiting_payment',
            payments: [],
            revisions: [],
            createdAt: now(),
            completedAt: null,
            cancelledAt: null,
            exceptionReason: null,
          },
          ...d.sales,
        ],
      }));
      return id;
    },

    addPayment(saleId: string, payment: Omit<PosPayment, 'id' | 'createdAt'>) {
      const id = newId();
      mutate((d) => updateSale(d, saleId, (s) => ({ ...s, payments: [...s.payments, { ...payment, id, createdAt: now() }] })));
      return id;
    },

    updatePayment(saleId: string, paymentId: string, patch: Partial<PosPayment>) {
      mutate((d) =>
        updateSale(d, saleId, (s) => ({
          ...s,
          payments: s.payments.map((p) => (p.id === paymentId ? { ...p, ...patch } : p)),
        })),
      );
    },

    /** Paid in full: the visible number is given here, from the register's sequence. */
    completeSale(saleId: string) {
      let number = '';
      mutate((d) => {
        const sale = d.sales.find((s) => s.id === saleId);
        const register = sale && d.registers.find((r) => r.id === sale.registerId);
        if (!sale || !register) return d;
        number = `${register.code}-${String(register.nextSequence).padStart(6, '0')}`;
        return {
          ...d,
          registers: d.registers.map((r) => (r.id === register.id ? { ...r, nextSequence: r.nextSequence + 1 } : r)),
          sales: d.sales.map((s) =>
            s.id === saleId ? { ...s, status: 'completed', number, completedAt: now(), exceptionReason: null } : s,
          ),
        };
      });
      return number;
    },

    cancelSale(saleId: string, reason: string, by: string) {
      mutate((d) =>
        audit(
          updateSale(d, saleId, (s) => ({ ...s, status: 'cancelled', cancelledAt: now() })),
          by,
          'sale_cancelled',
          reason,
        ),
      );
    },

    markException(saleId: string, reason: string) {
      mutate((d) => updateSale(d, saleId, (s) => ({ ...s, status: 'payment_exception', exceptionReason: reason })));
    },

    /** Item swap after payment: the previous version is kept, never edited silently. */
    reviseSale(saleId: string, lines: PosSaleLine[], totals: PosSaleTotals, reason: string, by: string) {
      mutate((d) =>
        audit(
          updateSale(d, saleId, (s) => ({
            ...s,
            revisions: [...s.revisions, { at: now(), by, reason, lines: s.lines, totals: s.totals }],
            lines,
            totals,
          })),
          by,
          'sale_revised',
          reason,
        ),
      );
    },

    createReturn(input: Omit<PosReturn, 'id' | 'number' | 'createdAt'>) {
      const id = newId();
      let number = '';
      mutate((d) => {
        number = `RET-${String(d.returnSequence).padStart(6, '0')}`;
        const returned = new Map(input.lines.map((l) => [l.saleLineId, l.quantity]));
        const next: PosCompanyData = {
          ...updateSale(d, input.saleId, (s) => ({
            ...s,
            lines: s.lines.map((l) => ({ ...l, returnedQuantity: l.returnedQuantity + (returned.get(l.id) ?? 0) })),
          })),
          returnSequence: d.returnSequence + 1,
          returns: [{ ...input, id, number, createdAt: now() }, ...d.returns],
        };
        return audit(next, input.createdBy, 'return_created', `${number} على ${input.saleNumber}`);
      });
      return { id, number };
    },

    recordRefund(returnId: string, reference: string | null, by: string) {
      mutate((d) =>
        audit(
          {
            ...d,
            returns: d.returns.map((r) =>
              r.id === returnId ? { ...r, refund: { ...r.refund, status: 'done', reference } } : r,
            ),
          },
          by,
          'refund_recorded',
          returnId,
        ),
      );
    },

    setDamagedDecision(returnId: string, decision: NonNullable<PosReturn['damagedDecision']>) {
      mutate((d) => ({
        ...d,
        returns: d.returns.map((r) => (r.id === returnId ? { ...r, damagedDecision: decision } : r)),
      }));
    },

    read,
  };
}

/** This browser's paired device, per company. */
const DEVICE_KEY = 'erp.pos.device';

export function readPairedDevice(companyId: string): string | null {
  try {
    const all = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '{}') as Record<string, string>;
    return all[companyId] ?? null;
  } catch {
    return null;
  }
}

export function writePairedDevice(companyId: string, deviceId: string | null): void {
  try {
    const all = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '{}') as Record<string, string>;
    if (deviceId) all[companyId] = deviceId;
    else delete all[companyId];
    localStorage.setItem(DEVICE_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the register still works, pairing is just not remembered.
  }
}

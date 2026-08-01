'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  PartnerAccountKind,
  PartnerAuthSessionPayload,
} from '@/features/ecommerce/storefront/domain/partner-auth';

export type StorefrontCustomerSession = {
  id: string;
  userId: string;
  partnerId: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  accountKind: PartnerAccountKind;
};

interface StorefrontCustomerUiState {
  customer: StorefrontCustomerSession | null;
  accessToken: string | null;
  /** Apply a successful register/login (or /me) payload. */
  setSession: (payload: PartnerAuthSessionPayload) => void;
  /** Local profile tweak (demo) until a partner profile PATCH exists. */
  updateProfile: (input: { name: string; phone: string; email: string }) => void;
  clearSession: () => void;
  /** @deprecated use setSession — kept for older call sites during migration */
  login: (input: { name: string; phone: string; email: string }) => void;
  logout: () => void;
}

function kindFromPayload(payload: PartnerAuthSessionPayload): PartnerAccountKind {
  if (payload.partner.isVendor) return 'vendor';
  if (payload.user.userType === 'visitor') return 'visitor';
  return 'customer';
}

function sessionFromPayload(payload: PartnerAuthSessionPayload): StorefrontCustomerSession {
  return {
    id: payload.partnerId,
    userId: payload.userId,
    partnerId: payload.partnerId,
    companyId: payload.companyId,
    name: payload.partner.displayName || payload.user.fullNameAr || payload.partner.name,
    phone: payload.partner.mobile || payload.user.phone,
    email: payload.partner.email || payload.user.email,
    accountKind: kindFromPayload(payload),
  };
}

export const useStorefrontCustomerUi = create<StorefrontCustomerUiState>()(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      setSession: (payload) =>
        set({
          accessToken: payload.access_token,
          customer: sessionFromPayload(payload),
        }),
      updateProfile: ({ name, phone, email }) => {
        const current = get().customer;
        if (!current) return;
        set({
          customer: {
            ...current,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
          },
        });
      },
      clearSession: () => set({ customer: null, accessToken: null }),
      login: ({ name, phone, email }) => {
        const companyId = get().customer?.companyId ?? '';
        set({
          accessToken: get().accessToken,
          customer: {
            id: get().customer?.id ?? crypto.randomUUID(),
            userId: get().customer?.userId ?? crypto.randomUUID(),
            partnerId: get().customer?.partnerId ?? crypto.randomUUID(),
            companyId,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            accountKind: get().customer?.accountKind ?? 'customer',
          },
        });
      },
      logout: () => set({ customer: null, accessToken: null }),
    }),
    {
      name: 'storefront-customer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer: state.customer,
        accessToken: state.accessToken,
      }),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as {
          customer?: Partial<StorefrontCustomerSession> & { id?: string };
          accessToken?: string | null;
        } | null;
        if (!state?.customer) {
          return { customer: null, accessToken: null };
        }
        const c = state.customer;
        return {
          accessToken: state.accessToken ?? null,
          customer: {
            id: c.id ?? crypto.randomUUID(),
            userId: c.userId ?? c.id ?? crypto.randomUUID(),
            partnerId: c.partnerId ?? c.id ?? crypto.randomUUID(),
            companyId: c.companyId ?? '',
            name: c.name ?? '',
            phone: c.phone ?? '',
            email: c.email ?? '',
            accountKind: c.accountKind ?? 'customer',
          },
        };
      },
    },
  ),
);

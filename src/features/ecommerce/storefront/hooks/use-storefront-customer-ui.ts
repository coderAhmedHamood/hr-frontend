'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  PartnerAccountKind,
  PartnerAuthSessionPayload,
  PartnerMePayload,
} from '@/features/ecommerce/storefront/domain/partner-auth';
import { writePartnerTokenCookie } from '@/features/ecommerce/storefront/lib/partner-token-cookie';

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
  /** Apply a successful register/login/profile payload. */
  setSession: (payload: PartnerAuthSessionPayload) => void;
  /** Refresh local customer from GET /me (keeps current token). */
  applyMe: (payload: PartnerMePayload) => void;
  clearSession: () => void;
  /** @deprecated use setSession — kept for older call sites during migration */
  login: (input: { name: string; phone: string; email: string }) => void;
  logout: () => void;
}

function kindFromPayload(payload: PartnerAuthSessionPayload | PartnerMePayload): PartnerAccountKind {
  if ('access_token' in payload && payload.partner.accountKind) {
    return payload.partner.accountKind;
  }
  if (payload.partner.isVendor) return 'vendor';
  if (payload.user.userType === 'visitor') return 'visitor';
  return 'customer';
}

function sessionFromPayload(
  payload: PartnerAuthSessionPayload | PartnerMePayload,
): StorefrontCustomerSession {
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

/**
 * A shopper counts as signed in only with both halves present. Checking just
 * `customer` (login page) while a guard checks just `accessToken` (checkout)
 * is what produced an endless cart → login → cart bounce.
 */
export function useIsStorefrontAuthenticated(): boolean {
  return useStorefrontCustomerUi((s) => Boolean(s.customer && s.accessToken));
}

export const useStorefrontCustomerUi = create<StorefrontCustomerUiState>()(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      setSession: (payload) => {
        writePartnerTokenCookie(payload.access_token);
        set({
          accessToken: payload.access_token,
          customer: sessionFromPayload(payload),
        });
      },
      applyMe: (payload) => {
        if (!get().accessToken) return;
        set({ customer: sessionFromPayload(payload) });
      },
      clearSession: () => {
        writePartnerTokenCookie(null);
        set({ customer: null, accessToken: null });
      },
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
      logout: () => {
        writePartnerTokenCookie(null);
        set({ customer: null, accessToken: null });
      },
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
        // A customer with no token is not a usable session: guards that check
        // the token would bounce to login, and the login page — seeing the
        // customer — would bounce straight back. Drop the half-state instead.
        if (!state?.customer || !state.accessToken) {
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
      onRehydrateStorage: () => (state) => {
        // Same invariant as `migrate`, for blobs written before it existed.
        if (state && state.customer && !state.accessToken) {
          state.customer = null;
        }
        writePartnerTokenCookie(state?.accessToken ?? null);
      },
    },
  ),
);

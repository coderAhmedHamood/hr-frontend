import { publicStoreRequest, unwrapStoreList } from '@/features/ecommerce/storefront/lib/api/store-http';
import type { PaymentAccountType } from '@/features/ecommerce/admin/payment-accounts/lib/api/payment-accounts-api';

/** Public storefront account — no internalNote / archive fields. */
export type PublicPaymentAccount = {
  id: string;
  type: PaymentAccountType;
  code?: string | null;
  nameAr: string;
  nameEn?: string | null;
  providerName?: string | null;
  accountHolderName?: string | null;
  mobile?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  currencyCode?: string | null;
  countryCode?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
  qrImageUrl?: string | null;
  logoUrl?: string | null;
  meta?: Record<string, unknown> | null;
  sortOrder?: number;
};

export async function fetchPublicPaymentAccounts(input: {
  companyId: string;
  type?: PaymentAccountType;
}): Promise<PublicPaymentAccount[]> {
  if (!input.companyId) return [];
  const data = await publicStoreRequest<unknown>('/public/store/payment-accounts', {
    query: {
      companyId: input.companyId,
      type: input.type,
    },
    nullOn404: true,
  });
  if (!data) return [];
  if (Array.isArray(data)) return data as PublicPaymentAccount[];
  return unwrapStoreList<PublicPaymentAccount>(data).items;
}

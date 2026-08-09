import {
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

export type PaymentAccountType =
  | 'bank'
  | 'network'
  | 'wallet'
  | 'cash'
  | 'card'
  | 'other';

export type ArchiveScope = 'active' | 'archived' | 'all';

export type StorePaymentAccount = {
  id: string;
  companyId: string;
  type: PaymentAccountType;
  code: string | null;
  nameAr: string;
  nameEn: string | null;
  providerName: string | null;
  accountHolderName: string | null;
  mobile: string | null;
  accountNumber: string | null;
  iban: string | null;
  currencyCode: string | null;
  countryCode: string | null;
  instructionsAr: string | null;
  instructionsEn: string | null;
  qrImageUrl: string | null;
  logoUrl: string | null;
  internalNote: string | null;
  meta: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
  showInStore: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentAccountListQuery = {
  page?: number;
  limit?: number;
  type?: PaymentAccountType;
  isActive?: boolean;
  showInStore?: boolean;
  search?: string;
  archiveScope?: ArchiveScope;
};

export type CreatePaymentAccountInput = {
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
  internalNote?: string | null;
  meta?: Record<string, unknown> | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
};

export type UpdatePaymentAccountInput = Partial<CreatePaymentAccountInput>;

function base(companyId: string) {
  return `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/payment-accounts`;
}

function listQuery(query: PaymentAccountListQuery) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    type: query.type,
    isActive: query.isActive,
    showInStore: query.showInStore,
    search: query.search?.trim() || undefined,
    archiveScope: query.archiveScope ?? 'active',
  };
}

function toBody(input: CreatePaymentAccountInput | UpdatePaymentAccountInput) {
  const body: Record<string, unknown> = { ...input };
  if (input.nameAr !== undefined) body.nameAr = input.nameAr.trim();
  if (input.nameEn !== undefined) body.nameEn = input.nameEn?.trim() || null;
  if (input.code !== undefined) body.code = input.code?.trim() || null;
  if (input.providerName !== undefined) {
    body.providerName = input.providerName?.trim() || null;
  }
  if (input.accountHolderName !== undefined) {
    body.accountHolderName = input.accountHolderName?.trim() || null;
  }
  if (input.mobile !== undefined) body.mobile = input.mobile?.trim() || null;
  if (input.accountNumber !== undefined) {
    body.accountNumber = input.accountNumber?.trim() || null;
  }
  if (input.iban !== undefined) body.iban = input.iban?.trim() || null;
  if (input.currencyCode !== undefined) {
    body.currencyCode = input.currencyCode?.trim().toUpperCase() || null;
  }
  if (input.countryCode !== undefined) {
    body.countryCode = input.countryCode?.trim().toUpperCase() || null;
  }
  if (input.instructionsAr !== undefined) {
    body.instructionsAr = input.instructionsAr?.trim() || null;
  }
  if (input.instructionsEn !== undefined) {
    body.instructionsEn = input.instructionsEn?.trim() || null;
  }
  if (input.internalNote !== undefined) {
    body.internalNote = input.internalNote?.trim() || null;
  }
  if (input.qrImageUrl !== undefined) body.qrImageUrl = input.qrImageUrl || null;
  if (input.logoUrl !== undefined) body.logoUrl = input.logoUrl || null;
  return body;
}

export const paymentAccountsApi = {
  async list(
    companyId: string,
    query: PaymentAccountListQuery = {},
  ): Promise<PaginatedResult<StorePaymentAccount>> {
    const result = await apiRequest<PaginatedResult<StorePaymentAccount>>(base(companyId), {
      query: listQuery(query),
      throwOnError: true,
    });
    return ensurePaginatedResult(result);
  },

  async get(companyId: string, id: string): Promise<StorePaymentAccount> {
    return apiRequest<StorePaymentAccount>(`${base(companyId)}/${id}`, {
      throwOnError: true,
    });
  },

  async create(
    companyId: string,
    input: CreatePaymentAccountInput,
  ): Promise<StorePaymentAccount> {
    return apiRequest<StorePaymentAccount>(base(companyId), {
      method: 'POST',
      throwOnError: true,
      body: toBody(input),
    });
  },

  async update(
    companyId: string,
    id: string,
    patch: UpdatePaymentAccountInput,
  ): Promise<StorePaymentAccount> {
    return apiRequest<StorePaymentAccount>(`${base(companyId)}/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      body: toBody(patch),
    });
  },

  async remove(companyId: string, id: string): Promise<void> {
    await apiRequest<void>(`${base(companyId)}/${id}`, {
      method: 'DELETE',
      throwOnError: true,
    });
  },

  async restore(companyId: string, id: string): Promise<StorePaymentAccount> {
    return apiRequest<StorePaymentAccount>(`${base(companyId)}/${id}/restore`, {
      method: 'POST',
      throwOnError: true,
      body: {},
    });
  },
};

export const PAYMENT_ACCOUNT_TYPE_LABELS_AR: Record<PaymentAccountType, string> = {
  bank: 'بنك',
  network: 'شبكة تحويل',
  wallet: 'محفظة',
  cash: 'نقدي',
  card: 'بطاقة',
  other: 'أخرى',
};

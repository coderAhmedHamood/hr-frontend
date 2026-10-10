import type { PartnerCategoryListQuery, PartnerListQuery } from '@/features/contacts/domain/types/partner';
import type { PartnerLedgerQuery } from '@/features/contacts/admin/partners/lib/api/partner-ledger';

export const partnersQueryKeys = {
  all: (companyId: string) => [companyId, 'contacts', 'partners'] as const,
  list: (query: PartnerListQuery) => [...partnersQueryKeys.all(query.companyId), 'list', query] as const,
  detail: (companyId: string, id: string) => [...partnersQueryKeys.all(companyId), 'detail', id] as const,
  full: (companyId: string, id: string) => [...partnersQueryKeys.all(companyId), 'full', id] as const,
  children: (companyId: string, id: string) => [...partnersQueryKeys.all(companyId), 'children', id] as const,
  notes: (companyId: string, id: string) => [...partnersQueryKeys.all(companyId), 'notes', id] as const,
  activities: (companyId: string, id: string) =>
    [...partnersQueryKeys.all(companyId), 'activities', id] as const,
  attachments: (companyId: string, id: string) =>
    [...partnersQueryKeys.all(companyId), 'attachments', id] as const,
  ledgerAll: (companyId: string, id: string) => [...partnersQueryKeys.all(companyId), 'ledger', id] as const,
  ledger: (query: PartnerLedgerQuery) =>
    [...partnersQueryKeys.ledgerAll(query.companyId, query.partnerId), query] as const,
};

export const partnerCategoriesQueryKeys = {
  all: (companyId: string) => [companyId, 'contacts', 'partner-categories'] as const,
  list: (query: PartnerCategoryListQuery) =>
    [...partnerCategoriesQueryKeys.all(query.companyId), 'list', query] as const,
};

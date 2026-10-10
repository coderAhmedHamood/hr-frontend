'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnersQueryKeys } from '@/features/contacts/admin/hooks/query-keys';
import {
  partnerLedgerApi,
  type CreatePartnerLedgerLine,
  type PartnerLedgerQuery,
} from '@/features/contacts/admin/partners/lib/api/partner-ledger';

export function usePartnerLedger(query: PartnerLedgerQuery, enabled = true) {
  return useQuery({
    queryKey: partnersQueryKeys.ledger(query),
    queryFn: () => partnerLedgerApi.statement(query),
    enabled: enabled && Boolean(query.companyId && query.partnerId),
    placeholderData: keepPreviousData,
  });
}

export function usePartnerLedgerMutations(companyId: string, partnerId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: partnersQueryKeys.ledgerAll(companyId, partnerId) });

  const create = useMutation({
    mutationFn: (input: Omit<CreatePartnerLedgerLine, 'companyId' | 'partnerId'>) =>
      partnerLedgerApi.create({ ...input, companyId, partnerId }),
    onSuccess: invalidate,
  });
  const voidLine = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      partnerLedgerApi.void(id, companyId, reason),
    onSuccess: invalidate,
  });
  return { create, voidLine };
}

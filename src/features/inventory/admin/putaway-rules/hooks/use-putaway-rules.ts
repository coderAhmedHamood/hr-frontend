import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { putawayRulesApi } from '@/features/inventory/admin/putaway-rules/lib/api/putaway-rules';
import type {
  CreatePutawayRuleInput,
  PutawayRuleListQuery,
  UpdatePutawayRuleInput,
} from '@/features/inventory/domain/types/putaway-rule';

export const putawayRulesQueryKeys = {
  all: ['ecommerce', 'putaway-rules'] as const,
  list: (query: PutawayRuleListQuery) => [...putawayRulesQueryKeys.all, 'list', query] as const,
  locations: (companyId: string) => [...putawayRulesQueryKeys.all, 'locations', companyId] as const,
};

export function usePutawayRules(query: PutawayRuleListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: putawayRulesQueryKeys.list(query),
    queryFn: () => putawayRulesApi.getAll(query),
    enabled: (options?.enabled ?? true) && Boolean(query.companyId),
  });
}

export function usePutawayLocationOptions(companyId: string) {
  return useQuery({
    queryKey: putawayRulesQueryKeys.locations(companyId),
    queryFn: () => putawayRulesApi.listLocationOptions(companyId),
    enabled: Boolean(companyId),
  });
}

export function usePutawayRuleMutations(companyId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: putawayRulesQueryKeys.all });

  const create = useMutation({
    mutationFn: (input: CreatePutawayRuleInput) => putawayRulesApi.create(input),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم إنشاء قاعدة التخزين');
    },
    onError: (err) => handleApiError(err, 'ecommerce.putawayRules.create'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePutawayRuleInput }) =>
      putawayRulesApi.update(companyId, id, patch),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم تحديث قاعدة التخزين');
    },
    onError: (err) => handleApiError(err, 'ecommerce.putawayRules.update'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => putawayRulesApi.remove(companyId, id),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم حذف قاعدة التخزين');
    },
    onError: (err) => handleApiError(err, 'ecommerce.putawayRules.delete'),
  });

  return { create, update, remove };
}

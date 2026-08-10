import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { catalogAttributesApi } from '@/features/ecommerce/admin/attributes/lib/api/catalog-attributes';
import type {
  CatalogAttributeListQuery,
  CreateCatalogAttributeInput,
  UpdateCatalogAttributeInput,
} from '@/features/ecommerce/domain/types/catalog-attribute';

export const catalogAttributesQueryKeys = {
  all: ['ecommerce', 'catalog-attributes'] as const,
  list: (query: CatalogAttributeListQuery) => [...catalogAttributesQueryKeys.all, 'list', query] as const,
};

export function useCatalogAttributes(query: CatalogAttributeListQuery) {
  return useQuery({
    queryKey: catalogAttributesQueryKeys.list(query),
    queryFn: () => catalogAttributesApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

export function useCatalogAttributeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: catalogAttributesQueryKeys.all });

  const create = useMutation({
    mutationFn: (input: CreateCatalogAttributeInput) => catalogAttributesApi.create(input),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم إنشاء الخاصية');
    },
    onError: (err) => handleApiError(err, 'ecommerce.attributes.create'),
  });

  const update = useMutation({
    mutationFn: ({
      companyId,
      id,
      patch,
    }: {
      companyId: string;
      id: string;
      patch: UpdateCatalogAttributeInput;
    }) => catalogAttributesApi.update(companyId, id, patch),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم تحديث الخاصية');
    },
    onError: (err) => handleApiError(err, 'ecommerce.attributes.update'),
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) =>
      catalogAttributesApi.remove(companyId, id),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم حذف الخاصية');
    },
    onError: (err) => handleApiError(err, 'ecommerce.attributes.delete'),
  });

  return { create, update, remove };
}

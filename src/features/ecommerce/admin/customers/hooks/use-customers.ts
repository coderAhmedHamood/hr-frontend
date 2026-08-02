import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/features/ecommerce/admin/customers/lib/api/customers';
import type { CustomerListQuery } from '@/features/ecommerce/domain/types/customer';

export const customersQueryKeys = {
  all: ['ecommerce', 'customers'] as const,
  list: (query: CustomerListQuery) => [...customersQueryKeys.all, 'list', query] as const,
};

export function useCustomers(query: CustomerListQuery) {
  return useQuery({
    queryKey: customersQueryKeys.list(query),
    queryFn: () => customersApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Customer,
  CustomerListQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/features/ecommerce/domain/types/customer';
import customersSeed from '@/features/ecommerce/shared/lib/mock/customers.json';

const repository = createMockRepository<Customer>(customersSeed as Customer[]);

/**
 * Admin customers CRM — no localStorage live sync from storefront checkout.
 * Storefront guests are not mirrored here; orders live in Nest store APIs.
 */
export const customersApi = {
  async getAll(query: CustomerListQuery): Promise<PaginatedResult<Customer>> {
    return repository.list(
      query,
      (item, q) => {
        if (q.isActive !== undefined && item.isActive !== q.isActive) return false;
        if (q.source && (item.source ?? 'seed') !== q.source) return false;
        if (q.city && (item.city ?? '') !== q.city) return false;
        if (q.search) {
          const search = q.search.toLowerCase();
          return (
            item.nameAr.toLowerCase().includes(search) ||
            item.email.toLowerCase().includes(search) ||
            (item.phone?.toLowerCase().includes(search) ?? false) ||
            (item.city?.toLowerCase().includes(search) ?? false)
          );
        }
        return true;
      },
      (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
  },
  async getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },
  create(input: CreateCustomerInput) {
    const now = new Date().toISOString();
    return repository.create({
      ...input,
      id: `cust-${Math.random().toString(36).slice(2, 10)}`,
      ordersCount: 0,
      totalSpentAmount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateCustomerInput) {
    return repository.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
};

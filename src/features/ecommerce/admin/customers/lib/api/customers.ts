import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import { listLiveCustomers } from '@/features/ecommerce/shared/lib/admin-live-commerce';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Customer,
  CustomerListQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/features/ecommerce/domain/types/customer';
import customersSeed from '@/features/ecommerce/shared/lib/mock/customers.json';

const repository = createMockRepository<Customer>(customersSeed as Customer[]);

const hydratedCustomerIds = new Set<string>();

async function hydrateLiveCustomers(companyId: string): Promise<void> {
  for (const customer of listLiveCustomers()) {
    if (customer.companyId !== companyId) continue;
    if (hydratedCustomerIds.has(customer.id)) {
      await repository.update(companyId, customer.id, customer);
      continue;
    }
    const existing = await repository.getById(companyId, customer.id);
    if (existing) {
      await repository.update(companyId, customer.id, customer);
    } else {
      await repository.create(customer);
    }
    hydratedCustomerIds.add(customer.id);
  }
}

export const customersApi = {
  async getAll(query: CustomerListQuery): Promise<PaginatedResult<Customer>> {
    await hydrateLiveCustomers(query.companyId);
    return repository.list(
      query,
      (item, q) => {
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
    await hydrateLiveCustomers(companyId);
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

import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

export type Customer = TenantScoped & {
  id: string;
  nameAr: string;
  nameEn?: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpentAmount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateCustomerInput = Omit<Customer, 'id' | 'ordersCount' | 'totalSpentAmount' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

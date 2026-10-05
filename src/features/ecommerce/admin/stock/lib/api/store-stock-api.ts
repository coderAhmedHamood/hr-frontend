import { apiRequest } from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

/**
 * The store's own quantity (phase 3): used when the company sells without
 * inventory (no store-stock-sync bridge). A product or variant with a level
 * is tracked — deducted when an order is placed, the order refused when short.
 */
export type StoreStockLevel = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  updatedAt: string;
  updatedBy: string | null;
};

const base = (companyId: string) =>
  `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/stock-levels`;

export const storeStockApi = {
  async listForProduct(companyId: string, productId: string): Promise<StoreStockLevel[]> {
    return apiRequest<StoreStockLevel[]>(base(companyId), {
      query: { productId },
      throwOnError: true,
    });
  },

  async setLevel(
    companyId: string,
    input: { productId: string; variantId?: string | null; quantity: number },
  ): Promise<StoreStockLevel> {
    return apiRequest<StoreStockLevel>(base(companyId), {
      method: 'PUT',
      throwOnError: true,
      body: input,
    });
  },

  async removeLevel(companyId: string, levelId: string): Promise<void> {
    await apiRequest<void>(`${base(companyId)}/${levelId}`, {
      method: 'DELETE',
      throwOnError: true,
    });
  },
};

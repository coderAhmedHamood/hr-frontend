import { apiRequest, ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';

export type InventoryProductFavorite = {
  id: string;
  partnerId: string;
  productId: string;
  companyId: string;
  createdAt: string;
  createdBy: string | null;
};

export type ProductFavoriteListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  partnerId?: string;
  productId?: string;
};

export type CreateProductFavoriteInput = {
  partnerId: string;
  productId: string;
};

/** Staff CRUD — `/inventory/product-favorites` (inv.catalog.product-favorites.*). Hard DELETE only; no PATCH. */
export const productFavoritesApi = {
  async list(query: ProductFavoriteListQuery = {}): Promise<PaginatedResult<InventoryProductFavorite>> {
    const result = await apiRequest<PaginatedResult<InventoryProductFavorite>>(
      '/inventory/product-favorites',
      {
        query: {
          page: query.page ?? 1,
          limit: query.limit ?? 50,
          companyId: query.companyId || undefined,
          partnerId: query.partnerId || undefined,
          productId: query.productId || undefined,
        },
        throwOnError: true,
      },
    );
    return ensurePaginatedResult(result);
  },

  async getById(id: string): Promise<InventoryProductFavorite | null> {
    try {
      return await apiRequest<InventoryProductFavorite>(`/inventory/product-favorites/${id}`, {
        throwOnError: true,
      });
    } catch {
      return null;
    }
  },

  async create(input: CreateProductFavoriteInput): Promise<InventoryProductFavorite> {
    return apiRequest<InventoryProductFavorite>('/inventory/product-favorites', {
      method: 'POST',
      throwOnError: true,
      body: {
        partnerId: input.partnerId,
        productId: input.productId,
      },
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/inventory/product-favorites/${id}`, {
      method: 'DELETE',
      throwOnError: true,
    });
  },
};

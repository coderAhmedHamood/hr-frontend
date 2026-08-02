import { apiRequest, ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ProductReviewStatus = 'pending' | 'approved' | 'rejected';

export type InventoryProductReview = {
  id: string;
  productId: string;
  companyId: string;
  partnerId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ProductReviewStatus;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ProductReviewListQuery = {
  page?: number;
  limit?: number;
  productId?: string;
  partnerId?: string;
  status?: ProductReviewStatus | 'all';
  search?: string;
};

export type CreateProductReviewInput = {
  productId: string;
  partnerId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  status?: ProductReviewStatus;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
};

export type UpdateProductReviewInput = Partial<CreateProductReviewInput>;

/** Staff CRUD — `/inventory/product-reviews` (inv.catalog.product-reviews.*). */
export const productReviewsApi = {
  async list(query: ProductReviewListQuery = {}): Promise<PaginatedResult<InventoryProductReview>> {
    const result = await apiRequest<PaginatedResult<InventoryProductReview>>(
      '/inventory/product-reviews',
      {
        query: {
          page: query.page ?? 1,
          limit: query.limit ?? 50,
          productId: query.productId || undefined,
          partnerId: query.partnerId || undefined,
          status: query.status && query.status !== 'all' ? query.status : undefined,
          search: query.search?.trim() || undefined,
        },
        throwOnError: true,
      },
    );
    return ensurePaginatedResult(result);
  },

  async getById(id: string): Promise<InventoryProductReview | null> {
    try {
      return await apiRequest<InventoryProductReview>(`/inventory/product-reviews/${id}`, {
        throwOnError: true,
      });
    } catch {
      return null;
    }
  },

  async create(input: CreateProductReviewInput): Promise<InventoryProductReview> {
    return apiRequest<InventoryProductReview>('/inventory/product-reviews', {
      method: 'POST',
      throwOnError: true,
      body: {
        productId: input.productId,
        partnerId: input.partnerId || null,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
        status: input.status ?? 'approved',
        guestName: input.guestName?.trim() || null,
        guestEmail: input.guestEmail?.trim() || null,
        guestPhone: input.guestPhone?.trim() || null,
      },
    });
  },

  async update(id: string, patch: UpdateProductReviewInput): Promise<InventoryProductReview> {
    return apiRequest<InventoryProductReview>(`/inventory/product-reviews/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      body: patch,
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/inventory/product-reviews/${id}`, {
      method: 'DELETE',
      throwOnError: true,
    });
  },
};

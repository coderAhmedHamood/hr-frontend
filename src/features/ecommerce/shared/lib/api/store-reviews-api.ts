import {
  isStoreHttpEnabled,
  publicStoreRequest,
  StoreHttpError,
  unwrapStoreList,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { ProductReview } from '@/features/ecommerce/storefront/lib/product-review-types';

type ProductReviewDto = {
  id: string;
  productId: string;
  companyId?: string;
  partnerId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  status?: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  isArchived?: boolean;
  createdAt: string;
};

export type PublicProductReviewsPage = {
  items: ProductReview[];
  total: number;
};

function mapReview(item: ProductReviewDto): ProductReview {
  return {
    id: item.id,
    authorName: item.guestName?.trim() || '',
    rating: item.rating,
    date: item.createdAt,
    comment: [item.title, item.body].filter(Boolean).join(' — ') || '',
    title: item.title?.trim() || '',
    body: item.body?.trim() || '',
    verified: Boolean(item.partnerId),
  };
}

/** GET /public/store/products/:productId/reviews — approved, non-archived only. */
export async function fetchPublicProductReviews(input: {
  companyId: string;
  productId: string;
  page?: number;
  limit?: number;
}): Promise<PublicProductReviewsPage> {
  if (!isStoreHttpEnabled()) return { items: [], total: 0 };
  const page = await publicStoreRequest<unknown>(
    `/public/store/products/${input.productId}/reviews`,
    {
      query: {
        companyId: resolveStorefrontCompanyId(input.companyId),
        page: input.page ?? 1,
        limit: input.limit ?? 20,
      },
      nullOn404: true,
    },
  );

  if (!page) return { items: [], total: 0 };

  const list = unwrapStoreList<ProductReviewDto>(page);
  // Public endpoint already returns approved + non-archived; keep a soft archived guard only.
  const items = list.items.filter((item) => !item.isArchived).map(mapReview);

  return {
    items,
    total: list.pagination.total || items.length,
  };
}

export type CreateStoreProductReviewInput = {
  companyId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  partnerId?: string | null;
  accessToken?: string | null;
};

export type CreateStoreProductReviewResult = {
  pendingModeration: boolean;
};

/**
 * Creates a storefront review via Next proxy `/api/store/product-reviews`
 * (public POST when available, else staff token fallback).
 */
export async function createStoreProductReview(
  input: CreateStoreProductReviewInput,
): Promise<CreateStoreProductReviewResult> {
  if (!isStoreHttpEnabled()) {
    throw new StoreHttpError('Store HTTP disabled', 503);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (input.accessToken) headers.Authorization = `Bearer ${input.accessToken}`;

  const response = await fetch('/api/store/product-reviews', {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      companyId: resolveStorefrontCompanyId(input.companyId),
      productId: input.productId,
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      guestName: input.guestName?.trim() || null,
      guestEmail: input.guestEmail?.trim() || null,
      guestPhone: input.guestPhone?.trim() || null,
      partnerId: input.partnerId || null,
    }),
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new StoreHttpError(message, response.status, payload);
  }

  const record = (payload ?? {}) as { pendingModeration?: boolean };
  return { pendingModeration: Boolean(record.pendingModeration) };
}

export function buildBreakdownFromReviews(reviews: ProductReview[]) {
  const total = reviews.length;
  const breakdown = ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    return {
      stars,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });
  const average =
    total === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / total;
  return { total, average, breakdown };
}

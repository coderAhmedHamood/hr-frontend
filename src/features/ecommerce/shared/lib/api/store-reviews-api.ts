import {
  isStoreHttpEnabled,
  publicStoreRequest,
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
  status: string;
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

  const list = unwrapStoreList<ProductReviewDto>(page);
  const items = list.items
    .filter((item) => item.status === 'approved' && !item.isArchived)
    .map((item) => ({
      id: item.id,
      authorName: item.guestName?.trim() || (item.partnerId ? 'عميل مسجّل' : 'عميل'),
      rating: item.rating,
      date: item.createdAt,
      comment: [item.title, item.body].filter(Boolean).join(' — ') || '',
      verified: Boolean(item.partnerId),
    }));

  return {
    items,
    total: list.pagination.total || items.length,
  };
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

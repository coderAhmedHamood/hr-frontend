import type { PaginatedResult } from '@/features/hr/lib/api/client';
import {
  isStoreHttpEnabled,
  publicStoreRequest,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { ProductReview } from '@/features/ecommerce/storefront/lib/product-review-types';

type ProductReviewDto = {
  id: string;
  productId: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  status: string;
  guestName?: string | null;
  createdAt: string;
};

export async function fetchPublicProductReviews(input: {
  companyId: string;
  productId: string;
  limit?: number;
}): Promise<ProductReview[]> {
  if (!isStoreHttpEnabled()) return [];
  const page = await publicStoreRequest<PaginatedResult<ProductReviewDto>>(
    `/public/store/products/${input.productId}/reviews`,
    {
      query: {
        companyId: resolveStorefrontCompanyId(input.companyId),
        page: 1,
        limit: input.limit ?? 20,
      },
      nullOn404: true,
    },
  );

  return (page?.items ?? [])
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      id: item.id,
      authorName: item.guestName?.trim() || 'عميل',
      rating: item.rating,
      date: item.createdAt,
      comment: [item.title, item.body].filter(Boolean).join(' — ') || '',
      verified: false,
    }));
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

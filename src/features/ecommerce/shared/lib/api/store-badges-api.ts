import {
  isStoreHttpEnabled,
  publicStoreRequest,
} from '@/features/ecommerce/storefront/lib/api/store-http';

export type StoreBadgesDto = {
  /** Partner token → server favorites count; without token → 0 */
  wishlistCount: number;
  /** Always null — cart is localStorage-only on the frontend */
  cartCount: null;
};

/** GET /public/store/badges — optional Partner Bearer */
export async function fetchPublicStoreBadges(
  token?: string | null,
): Promise<StoreBadgesDto> {
  if (!isStoreHttpEnabled()) {
    return { wishlistCount: 0, cartCount: null };
  }

  const data = await publicStoreRequest<StoreBadgesDto>('/public/store/badges', {
    token: token || undefined,
    nullOn404: true,
  });

  return {
    wishlistCount: Math.max(0, Number(data?.wishlistCount) || 0),
    cartCount: null,
  };
}

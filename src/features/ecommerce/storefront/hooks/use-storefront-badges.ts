'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPublicStoreBadges } from '@/features/ecommerce/shared/lib/api/store-badges-api';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { useStorefrontWishlistUi } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';
import { isStoreHttpEnabled } from '@/features/ecommerce/storefront/lib/api/store-http';

export const storeBadgesQueryKeys = {
  all: ['storefront', 'badges'] as const,
  byToken: (token: string | null) => [...storeBadgesQueryKeys.all, token ?? 'guest'] as const,
};

/** GET /public/store/badges — wishlistCount from server when partner token present. */
export function useStorefrontBadges() {
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);

  return useQuery({
    queryKey: storeBadgesQueryKeys.byToken(accessToken),
    queryFn: () => fetchPublicStoreBadges(accessToken),
    enabled: isStoreHttpEnabled(),
    staleTime: 30_000,
  });
}

/**
 * Header wishlist badge:
 * - Guest → local `storefront-wishlist` (API returns 0 without token)
 * - Partner before wishlist hydrate → server `wishlistCount`
 * - Partner after hydrate → local IDs (optimistic toggles; synced with server)
 */
export function useWishlistBadgeCount(): number {
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const localCount = useStorefrontWishlistUi((s) => s.productIds.length);
  const hydratedToken = useStorefrontWishlistUi((s) => s.hydratedToken);
  const { data } = useStorefrontBadges();

  if (!accessToken) return localCount;
  if (hydratedToken !== accessToken) return data?.wishlistCount ?? localCount;
  return localCount;
}

'use client';

import { useStorefrontWishlistSync } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';

/** Mount once in the storefront shell to hydrate partner wishlist over HTTP. */
export function StorefrontWishlistHydrator() {
  useStorefrontWishlistSync();
  return null;
}

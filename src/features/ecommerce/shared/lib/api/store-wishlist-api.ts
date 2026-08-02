import {
  publicStoreRequest,
  unwrapStoreList,
} from '@/features/ecommerce/storefront/lib/api/store-http';

export type StoreWishlistItemDto = {
  id: string;
  productId: string;
  productSlug: string;
  productNameAr: string;
  productNameEn?: string | null;
  priceAmount: string;
  priceCurrency: string;
  primaryImageUrl?: string | null;
  createdAt: string;
};

/**
 * Partner JWT (`typ=partner`) — companyId/partnerId from token only.
 * Table: `inventory_product_favorites`.
 */

/** GET /public/store/wishlist — `{ items, pagination }` */
export async function fetchPartnerWishlist(token: string): Promise<StoreWishlistItemDto[]> {
  if (!token) return [];
  const page = await publicStoreRequest<unknown>('/public/store/wishlist', {
    token,
    query: { page: 1, limit: 200 },
    nullOn404: true,
  });
  return unwrapStoreList<StoreWishlistItemDto>(page).items;
}

/** POST /public/store/wishlist → 201 · body `{ productId }` · data = full list after add */
export async function addPartnerWishlistItem(
  token: string,
  productId: string,
): Promise<StoreWishlistItemDto[]> {
  if (!token) throw new Error('PARTNER_TOKEN_REQUIRED');
  const page = await publicStoreRequest<unknown>('/public/store/wishlist', {
    method: 'POST',
    token,
    body: { productId },
  });
  return unwrapStoreList<StoreWishlistItemDto>(page).items;
}

/** DELETE /public/store/wishlist/:productId → 204 (`:productId` = product UUID) */
export async function removePartnerWishlistItem(token: string, productId: string): Promise<void> {
  if (!token) throw new Error('PARTNER_TOKEN_REQUIRED');
  await publicStoreRequest(`/public/store/wishlist/${productId}`, {
    method: 'DELETE',
    token,
  });
}

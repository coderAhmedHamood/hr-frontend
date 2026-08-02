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

/** GET /public/store/wishlist — Partner JWT · binding §4 `{ items, pagination }`. */
export async function fetchPartnerWishlist(token: string): Promise<StoreWishlistItemDto[]> {
  if (!token) return [];
  const page = await publicStoreRequest<unknown>('/public/store/wishlist', {
    token,
    query: { page: 1, limit: 200 },
    nullOn404: true,
  });
  return unwrapStoreList<StoreWishlistItemDto>(page).items;
}

/** POST /public/store/wishlist → data is list shape after add. */
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

/** DELETE /public/store/wishlist/:productId → 204 */
export async function removePartnerWishlistItem(token: string, productId: string): Promise<void> {
  if (!token) throw new Error('PARTNER_TOKEN_REQUIRED');
  await publicStoreRequest(`/public/store/wishlist/${productId}`, {
    method: 'DELETE',
    token,
  });
}

import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';

export type ProductDisplayImage = {
  url: string;
  alt: string;
};

export type ProductDisplayModel = {
  imageUrl: string | null;
  imageAlt: string;
  /** Ordered gallery images for card/PDP carousels (images only). */
  images: ProductDisplayImage[];
  outOfStock: boolean;
  hasDeal: boolean;
  discountPercent: number | null;
  /** Flag-driven promo chip (with tag fallback). */
  promoBadge: 'new' | 'best-seller' | 'deals' | 'wholesale' | 'discount' | null;
  sellingFast: boolean;
  /** From inventory `ratingAvg` / `reviewCount` — no mock fallback. */
  rating: number | null;
  reviewCount: number;
};

function resolvePromoBadge(product: StorefrontProduct): ProductDisplayModel['promoBadge'] {
  if (product.isTodayDealActive) return 'deals';
  if (product.isWholesaleActive) return 'wholesale';
  if (product.isDiscountActive) return 'discount';
  if (product.isNewProductActive) return 'new';

  const normalized = product.tags.map((tag) => tag.toLowerCase());
  if (normalized.some((tag) => tag.includes('wholesale') || tag.includes('جملة'))) return 'wholesale';
  if (normalized.some((tag) => tag.includes('best'))) return 'best-seller';
  if (normalized.some((tag) => tag.includes('deal') || tag.includes('offer'))) return 'deals';
  return null;
}

function isSellingFast(product: StorefrontProduct): boolean {
  if (!product.inventory.trackInventory) return false;
  if (product.stockStatus !== 'in_stock') return false;
  return product.inventory.quantity <= product.inventory.lowStockThreshold;
}

function resolveGalleryImages(product: StorefrontProduct): ProductDisplayImage[] {
  const fromMedia = [...product.media]
    .filter((item) => item.type === 'image' && Boolean(item.url))
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      url: item.url,
      alt: item.alt || product.imageAlt || product.name,
    }));

  if (fromMedia.length > 0) return fromMedia;

  if (product.imageUrl) {
    return [{ url: product.imageUrl, alt: product.imageAlt || product.name }];
  }

  return [];
}

export function buildProductDisplay(product: StorefrontProduct): ProductDisplayModel {
  const images = resolveGalleryImages(product);
  const primaryMedia = product.media.find((item) => item.isPrimary) ?? product.media[0] ?? null;
  const imageUrl = images[0]?.url ?? primaryMedia?.url ?? product.imageUrl;
  const imageAlt = images[0]?.alt ?? primaryMedia?.alt ?? (product.imageAlt || product.name);
  const outOfStock = product.stockStatus === 'out_of_stock' || product.stockStatus === 'discontinued';
  const hasDeal = Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
  const discountPercent =
    hasDeal && product.compareAtPrice
      ? Math.round(((product.compareAtPrice.amount - product.price.amount) / product.compareAtPrice.amount) * 100)
      : product.isDiscountActive && product.discountPercent != null
        ? Math.round(product.discountPercent)
        : null;

  return {
    imageUrl,
    imageAlt,
    images,
    outOfStock,
    hasDeal,
    discountPercent,
    promoBadge: resolvePromoBadge(product),
    sellingFast: isSellingFast(product),
    rating: product.rating != null && product.rating > 0 ? product.rating : null,
    reviewCount: Math.max(0, Math.floor(Number(product.reviewCount ?? 0) || 0)),
  };
}

export function hasProductDeal(product: StorefrontProduct): boolean {
  return Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
}

export type StorefrontVariant = StorefrontProduct['variants'][number];

const SOFT_MAX_QTY = 99;

/**
 * Real on-hand units when inventory is tracked; `null` when not tracked.
 *
 * When variants exist but none have allocated qty yet, stock usually still lives on the
 * product (template). Fall back to product quantity so the store matches admin totals
 * (e.g. product quantityCache 210 while every variant is still 0).
 */
export function getWarehouseOnHand(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): number | null {
  if (!product.inventory.trackInventory) return null;
  if (!variant) {
    return Math.max(0, Math.floor(product.inventory.quantity));
  }
  if (variant.quantity > 0) {
    return Math.max(0, Math.floor(variant.quantity));
  }
  const anyVariantStocked = product.variants.some((row) => row.quantity > 0);
  if (!anyVariantStocked) {
    return Math.max(0, Math.floor(product.inventory.quantity));
  }
  return 0;
}

/** Hide warehouse count when not tracking, or when backorders are allowed. */
export function shouldShowWarehouseStock(product: StorefrontProduct): boolean {
  return product.inventory.trackInventory && !product.inventory.allowBackorder;
}

/**
 * Max orderable qty.
 * - No tracking → soft cap only
 * - Backorder allowed → soft cap (sell despite 0)
 * - Tracking → warehouse on-hand
 */
export function getOrderQuantityMax(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): number {
  if (!product.inventory.trackInventory) return SOFT_MAX_QTY;
  if (product.inventory.allowBackorder) return SOFT_MAX_QTY;
  return Math.min(SOFT_MAX_QTY, getWarehouseOnHand(product, variant) ?? 0);
}

/** @deprecated Prefer getWarehouseOnHand + getOrderQuantityMax */
export function getAvailableOrderQuantity(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): number | null {
  if (!product.inventory.trackInventory) return null;
  if (product.inventory.allowBackorder) return getOrderQuantityMax(product, variant);
  return getWarehouseOnHand(product, variant);
}

export type PurchaseStockStatus = StorefrontProduct['stockStatus'];

/** Align displayed status with warehouse + backorder rules. */
export function resolvePurchaseStockStatus(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): PurchaseStockStatus {
  const raw = variant?.stockStatus ?? product.stockStatus;
  if (raw === 'discontinued') return 'discontinued';

  if (!product.inventory.trackInventory) {
    return raw === 'preorder' ? 'preorder' : raw === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
  }

  const onHand = getWarehouseOnHand(product, variant) ?? 0;

  if (product.inventory.allowBackorder) {
    return onHand > 0 ? 'in_stock' : 'preorder';
  }

  if (raw === 'preorder') return 'preorder';
  if (onHand <= 0) return 'out_of_stock';
  return raw === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
}

export function canOrderQuantity(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): boolean {
  const status = resolvePurchaseStockStatus(product, variant);
  if (status === 'discontinued') return false;
  if (!product.inventory.trackInventory) {
    return status === 'in_stock' || status === 'preorder';
  }
  if (product.inventory.allowBackorder) return true;
  if (status === 'preorder') return true;
  return getOrderQuantityMax(product, variant) > 0;
}

export type OrderBlockReason =
  | 'variant_required'
  | 'discontinued'
  | 'out_of_stock'
  | 'unavailable';

export function getOrderBlockReason(
  product: StorefrontProduct,
  options?: {
    variant?: StorefrontVariant | null;
    requireVariant?: boolean;
    hasActiveVariant?: boolean;
  },
): OrderBlockReason | null {
  if (options?.requireVariant && !options.hasActiveVariant) return 'variant_required';
  const status = resolvePurchaseStockStatus(product, options?.variant);
  if (status === 'discontinued') return 'discontinued';
  if (canOrderQuantity(product, options?.variant)) return null;
  if (status === 'out_of_stock') return 'out_of_stock';
  return 'unavailable';
}

export function resolveLineUnitPrice(
  product: StorefrontProduct,
  variant?: StorefrontVariant | null,
): StorefrontProduct['price'] {
  return variant?.price ?? product.price;
}

export function resolveLineCompareAtPrice(
  product: StorefrontProduct,
  unitPrice: StorefrontProduct['price'],
): StorefrontProduct['compareAtPrice'] {
  if (!product.compareAtPrice) return null;
  if (product.compareAtPrice.amount > unitPrice.amount) return product.compareAtPrice;
  return null;
}

export function resolveDiscountPercent(
  unitPrice: StorefrontProduct['price'],
  compareAt: StorefrontProduct['compareAtPrice'],
): number | null {
  if (!compareAt || compareAt.amount <= unitPrice.amount) return null;
  return Math.round(((compareAt.amount - unitPrice.amount) / compareAt.amount) * 100);
}

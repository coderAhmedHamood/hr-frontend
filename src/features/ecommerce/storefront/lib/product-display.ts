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
  /** Tag-driven promo chip (best-seller / deals / wholesale). */
  promoBadge: 'best-seller' | 'deals' | 'wholesale' | null;
  sellingFast: boolean;
  /** Deterministic mock social proof until catalog API provides ratings. */
  rating: number;
  reviewCount: number;
};

function mockSocialProof(id: string): { rating: number; reviewCount: number } {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % 997;
  }
  return {
    rating: Math.round((3.8 + (hash % 12) / 10) * 10) / 10,
    reviewCount: 40 + (hash % 2400),
  };
}

function resolvePromoBadge(tags: string[]): 'best-seller' | 'deals' | 'wholesale' | null {
  const normalized = tags.map((tag) => tag.toLowerCase());
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
      : null;
  const social = mockSocialProof(product.id);

  return {
    imageUrl,
    imageAlt,
    images,
    outOfStock,
    hasDeal,
    discountPercent,
    promoBadge: resolvePromoBadge(product.tags),
    sellingFast: isSellingFast(product),
    rating: social.rating,
    reviewCount: social.reviewCount,
  };
}

export function hasProductDeal(product: StorefrontProduct): boolean {
  return Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
}

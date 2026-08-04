/**
 * Shared primitives for the Ecommerce domain. Mirrors the pagination envelope shape of
 * `@/features/hr/lib/api/client` (`items` + `pagination`) so swapping the mock repository
 * for the real backend later requires no caller changes.
 */

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type Money = {
  amount: number;
  currency: string;
};

export type MediaType = 'image' | 'video';

/**
 * A single ordered media item. `width`/`height` let `next/image` avoid layout shift without a
 * network round-trip (Performance Contract's CLS target). Superseded `MediaAsset` (`{url, alt}`).
 */
export type MediaItem = {
  id: string;
  url: string;
  alt: string;
  type: MediaType;
  position: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
};

/** @deprecated superseded by `MediaItem` — kept only until every consumer migrates. */
export type MediaAsset = {
  url: string;
  alt: string;
};

/** Every entity that will eventually be addressable from the public storefront needs a slug. */
export type Slugged = {
  slug: string;
};

/**
 * SEO metadata carried on the entity itself. `canonicalPath` overrides the default
 * slug-derived canonical URL; `ogImage`/`keywords` support the SEO Contract's OpenGraph rules.
 */
export type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
  ogImage?: string;
  keywords?: string[];
};

/** Every entity is scoped to the company (tenant) that owns it. */
export type TenantScoped = {
  companyId: string;
};

/**
 * Embedded on `Product` as a **display cache** only.
 * Source of truth for balances is `LocationStock` (on-hand per location).
 * `quantity` is synced from warehouse on-hand after validated operations — never write
 * stock changes through the product form.
 */
export type Inventory = {
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
};

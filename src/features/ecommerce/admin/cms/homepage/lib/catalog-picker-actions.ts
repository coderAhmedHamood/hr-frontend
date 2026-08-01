'use server';

import { cookies } from 'next/headers';
import { mockProductsStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';

export type CatalogPickerProduct = {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  tags: string[];
  priceAmount: number;
  priceCurrency: string;
  compareAtPriceAmount?: number | null;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';
};

export type MediaLibraryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

export type CatalogPickerCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
};

type InventoryProductDto = {
  id: string;
  sku: string;
  slug?: string;
  nameAr: string;
  nameEn?: string | null;
  categoryId?: string | null;
  tags?: string[] | null;
  priceAmount: string | number;
  priceCurrency: string;
  compareAtPriceAmount?: string | number | null;
  compareAtPriceCurrency?: string | null;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';
  media?: Array<{ url: string; isPrimary?: boolean; alt?: string }> | null;
};

type InventoryCategoryDto = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
};

function apiBase(): string {
  return resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
}

async function authHeaders(): Promise<HeadersInit> {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchInventoryJson<T>(path: string, query: Record<string, string>): Promise<T | null> {
  try {
    const params = new URLSearchParams(query);
    const response = await fetch(`${apiBase()}${path}?${params}`, {
      headers: await authHeaders(),
      cache: 'no-store',
      credentials: 'include',
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: T } | T;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload.data ?? null) as T | null;
    }
    return payload as T;
  } catch {
    return null;
  }
}

function mapInventoryProduct(dto: InventoryProductDto): CatalogPickerProduct {
  const primary = dto.media?.find((item) => item.isPrimary) ?? dto.media?.[0];
  const compareAt =
    dto.compareAtPriceAmount != null && dto.compareAtPriceAmount !== ''
      ? Number(dto.compareAtPriceAmount)
      : null;
  return {
    id: dto.id,
    sku: dto.sku,
    slug: dto.slug?.trim() || dto.sku,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? null,
    imageUrl: primary?.url ?? null,
    categoryId: dto.categoryId ?? null,
    tags: dto.tags ?? [],
    priceAmount: Number(dto.priceAmount) || 0,
    priceCurrency: dto.priceCurrency || 'YER',
    compareAtPriceAmount: Number.isFinite(compareAt) ? compareAt : null,
    stockStatus: dto.stockStatus ?? 'in_stock',
  };
}

async function listInventoryProducts(companyId: string): Promise<CatalogPickerProduct[] | null> {
  const page = await fetchInventoryJson<{ items?: InventoryProductDto[] }>('/inventory/products', {
    companyId,
    page: '1',
    limit: '100',
    archiveScope: 'active',
  });
  if (!page?.items?.length) return null;
  return page.items.map(mapInventoryProduct);
}

async function listInventoryCategories(companyId: string): Promise<CatalogPickerCategory[] | null> {
  // Public endpoint — works for anonymous storefront + CMS without inventory token.
  const page = await fetchInventoryJson<{ items?: InventoryCategoryDto[] }>(
    '/public/inventory/categories',
    {
      companyId,
      page: '1',
      limit: '300',
    },
  );
  if (!page?.items?.length) return null;
  return page.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      nameAr: item.nameAr,
      nameEn: item.nameEn ?? null,
      parentId: item.parentId ?? null,
      imageUrl: item.imageUrl ?? null,
    }));
}

async function listMockProducts(companyId: string): Promise<CatalogPickerProduct[]> {
  const result = await mockProductsStore.list({ companyId, page: 1, limit: 200, status: 'active' });
  return result.items.map((product) => {
    const primary = product.media.find((item) => item.isPrimary) ?? product.media[0];
    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      nameAr: product.nameAr,
      nameEn: product.nameEn ?? null,
      imageUrl: primary?.url ?? null,
      categoryId: product.categoryId ?? null,
      tags: product.tags ?? [],
      priceAmount: product.price.amount,
      priceCurrency: product.price.currency,
      compareAtPriceAmount: product.compareAtPrice?.amount ?? null,
      stockStatus: product.stockStatus,
    };
  });
}

/** Products for section data-source pickers.
 * Frontend-first: mock catalog is the contract source so admin picks match storefront
 * (anonymous `/store` has no inventory auth). Inventory is used when mock is empty.
 */
export async function listCatalogPickerProducts(companyId: string): Promise<CatalogPickerProduct[]> {
  const resolved = resolveStorefrontCompanyId(companyId);
  const fromMock = await listMockProducts(resolved);
  if (fromMock.length > 0) return fromMock;
  const fromApi = await listInventoryProducts(resolved);
  return fromApi ?? [];
}

/** Categories for section data-source pickers — public inventory categories only. */
export async function listCatalogPickerCategories(companyId: string): Promise<CatalogPickerCategory[]> {
  const resolved = resolveStorefrontCompanyId(companyId);
  return (await listInventoryCategories(resolved)) ?? [];
}

/**
 * Media library images for the CMS image picker.
 * Backend endpoint is not implemented yet — returns [] until a real
 * "browse uploaded images" endpoint exists; the picker UI handles the empty state.
 */
export async function listMediaLibraryImages(companyId: string): Promise<MediaLibraryImage[]> {
  const resolved = resolveStorefrontCompanyId(companyId);
  const page = await fetchInventoryJson<{ items?: Array<{ id: string; url: string; alt?: string | null }> }>(
    '/media/images',
    { companyId: resolved, page: '1', limit: '200' },
  );
  if (!page?.items?.length) return [];
  return page.items.map((item) => ({ id: item.id, url: item.url, alt: item.alt ?? null }));
}

/** Used by storefront resolvers — same precedence as pickers. */
export async function resolveCatalogProductsForStorefront(
  companyId: string,
  options?: {
    ids?: string[];
    categoryId?: string | null;
    tag?: string | null;
    limit?: number;
    sort?: 'createdAt' | 'price' | 'name';
    sortDirection?: 'asc' | 'desc';
  },
): Promise<CatalogPickerProduct[]> {
  const resolved = resolveStorefrontCompanyId(companyId);
  let items = await listCatalogPickerProducts(resolved);

  if (options?.ids?.length) {
    const order = new Map(options.ids.map((id, index) => [id, index]));
    items = items
      .filter((item) => order.has(item.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  if (options?.categoryId) {
    items = items.filter((item) => item.categoryId === options.categoryId);
  }
  if (options?.tag) {
    items = items.filter((item) => item.tags.includes(options.tag!));
  }

  const direction = options?.sortDirection === 'asc' ? 1 : -1;
  if (options?.sort === 'price') {
    items = [...items].sort((a, b) => (a.priceAmount - b.priceAmount) * direction);
  } else if (options?.sort === 'name') {
    items = [...items].sort((a, b) => a.nameAr.localeCompare(b.nameAr) * direction);
  }

  return items.slice(0, options?.limit ?? 24);
}

export async function resolveCatalogCategoriesForStorefront(
  companyId: string,
  options?: { ids?: string[]; limit?: number; rootsOnly?: boolean },
): Promise<CatalogPickerCategory[]> {
  const resolved = resolveStorefrontCompanyId(companyId);
  let items = await listCatalogPickerCategories(resolved);
  if (options?.ids?.length) {
    const order = new Map(options.ids.map((id, index) => [id, index]));
    items = items
      .filter((item) => order.has(item.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  } else if (options?.rootsOnly) {
    const roots = items.filter((item) => !item.parentId);
    items = roots.length > 0 ? roots : items;
  }
  // Default: full adjacency list so category-grid can drill into children.
  return items.slice(0, options?.limit ?? 200);
}

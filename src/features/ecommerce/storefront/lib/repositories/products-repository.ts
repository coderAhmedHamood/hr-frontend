import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { resolveAccessToken } from '@/features/auth/lib/auth-cookie';
import { publicConfig } from '@/shared/config';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import type { Product, ProductAttribute, ProductVariant } from '@/features/ecommerce/domain/types/product';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontProductListQuery,
  StorefrontProductsPort,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import { logStorefrontApi } from '@/features/ecommerce/storefront/lib/debug-storefront-api';
import { storefrontPublicFetchInit } from '@/features/ecommerce/storefront/lib/api/store-http';
import { mapStorefrontProduct, mapStorefrontProducts } from '@/features/ecommerce/storefront/lib/mappers/product-mapper';
import { STORE_CURRENCY_CODE } from '@/features/ecommerce/domain/constants/store-currency';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { toNumber, toOptionalNumber } from '@/features/inventory/lib/api/numbers';
import { mapProductStockDto, type ProductStockDto } from '@/features/inventory/admin/stock/lib/api/inventory-stock-api';
import type { ProductStockSnapshot } from '@/features/inventory/domain/types/product-stock';

type PublicAttrValueDto = {
  id: string;
  nameAr: string;
  freeText?: string | null;
  defaultExtraPrice?: string | number | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

type PublicAttrLineDto = {
  id: string;
  catalogAttributeId?: string | null;
  nameAr: string;
  displayType: ProductAttribute['displayType'];
  createVariant: ProductAttribute['createVariant'];
  sortOrder?: number;
  values?: PublicAttrValueDto[];
};

type PublicVariantLinkDto = {
  id: string;
  productAttributeValueId: string;
  attributeNameAr: string;
  valueNameAr: string;
  colorHex?: string | null;
};

type PublicVariantDto = {
  id: string;
  combinationKey: string;
  sku: string;
  nameAr: string;
  description?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  salePriceAmount: string | number;
  salePriceCurrency?: string;
  costPriceAmount?: string | number;
  costPriceCurrency?: string;
  quantityCache?: string | number;
  stockStatus: ProductVariant['stockStatus'];
  isActive: boolean;
  attributeValueIds?: string[];
  attributeLinks?: PublicVariantLinkDto[];
};

type PublicProductDto = {
  id: string;
  companyId: string;
  brandId?: string | null;
  categoryId?: string | null;
  sku: string;
  slug: string;
  barcode?: string | null;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  status: Product['status'];
  stockStatus: Product['stockStatus'];
  productType?: Product['productType'];
  tracking?: Product['tracking'];
  invoicePolicy?: Product['invoicePolicy'];
  priceAmount: string | number;
  priceCurrency: string;
  compareAtPriceAmount?: string | number | null;
  compareAtPriceCurrency?: string | null;
  trackInventory: boolean;
  quantityCache: string | number;
  /** Present when list is requested with includeQuantity=true. */
  availableQuantity?: string | number | null;
  lowStockThreshold: string | number;
  allowBackorder: boolean;
  isNewProduct?: boolean;
  newUntil?: string | null;
  isTodayDeal?: boolean;
  dealPriceAmount?: string | number | null;
  dealDays?: string | number | null;
  dealUntil?: string | null;
  isWholesale?: boolean;
  wholesalePriceAmount?: string | number | null;
  wholesaleUntil?: string | null;
  isDiscounted?: boolean;
  discountPercent?: string | number | null;
  discountUntil?: string | null;
  isNewProductActive?: boolean;
  isTodayDealActive?: boolean;
  isWholesaleActive?: boolean;
  isDiscountActive?: boolean;
  tags?: string[] | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  seoCanonicalPath?: string | null;
  seoOgImage?: string | null;
  seoKeywords?: string[] | null;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  ratingAvg?: string | number | null;
  reviewCount?: string | number | null;
  /** Some payloads use nested / alternate keys. */
  rating?: string | number | null;
  rating_avg?: string | number | null;
  review_count?: string | number | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present when public/detail APIs nest catalog graph. */
  attributes?: PublicAttrLineDto[];
  variants?: PublicVariantDto[];
};

type PaginatedProductDto = {
  items: PublicProductDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function unwrapEnvelope<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { status?: number; data?: T; error?: unknown };
  const statusOk =
    typeof record.status === 'number' && record.status >= 200 && record.status < 300;
  if (statusOk && 'data' in record && record.data != null && record.error == null) {
    return record.data;
  }
  return payload as T;
}

async function publicProductRequest<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const base = resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
  const url = `${base}${path}${qs ? `?${qs}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      ...storefrontPublicFetchInit('GET'),
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      logStorefrontApi({ url, status: response.status, ok: false });
      return null;
    }
    const payload: unknown = await response.json();
    const data = unwrapEnvelope<T>(payload);
    logStorefrontApi({ url, status: response.status, ok: true, data });
    return data;
  } catch (error) {
    logStorefrontApi({ url, ok: false, error });
    return null;
  }
}

function mapPublicAttributes(items: PublicAttrLineDto[] | undefined): ProductAttribute[] {
  return (items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((line) => ({
      id: line.id,
      attributeId: line.catalogAttributeId ?? undefined,
      nameAr: line.nameAr,
      displayType: line.displayType,
      createVariant: line.createVariant,
      values: (line.values ?? [])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((value) => ({
          id: value.id,
          nameAr: value.nameAr,
          freeText: value.freeText ?? undefined,
          defaultExtraPrice: toOptionalNumber(value.defaultExtraPrice),
          colorHex: value.colorHex ?? undefined,
          imageUrl: value.imageUrl ?? undefined,
        })),
    }));
}

/** Build an ordered MediaItem gallery from a variant's image URLs. */
function toVariantMedia(
  images: string[] | null | undefined,
  imageUrl: string | null | undefined,
  alt: string,
): { imageUrl?: string; images?: MediaItem[] } {
  const urls = (images ?? []).map((url) => url?.trim()).filter((url): url is string => Boolean(url));
  const primary = imageUrl?.trim() || urls[0];
  const ordered = urls.length > 0 ? urls : primary ? [primary] : [];
  if (ordered.length === 0) return {};
  return {
    imageUrl: primary,
    images: ordered.map((url, index) => ({
      id: `variant-img-${index}`,
      url,
      alt,
      type: 'image' as const,
      position: index,
      isPrimary: index === 0,
    })),
  };
}

function mapPublicVariants(items: PublicVariantDto[] | undefined): ProductVariant[] {
  return (items ?? []).map((dto) => {
    const links = dto.attributeLinks ?? [];
    const attributeValueIds =
      dto.attributeValueIds ?? links.map((link) => link.productAttributeValueId);
    const currency = 'YER';
    return {
      id: dto.id,
      combinationKey: dto.combinationKey,
      sku: dto.sku,
      nameAr: dto.nameAr,
      attributeValueIds,
      attributeLabels: links.map((link) => ({
        attributeNameAr: link.attributeNameAr,
        valueNameAr: link.valueNameAr,
        colorHex: link.colorHex ?? undefined,
      })),
      salePrice: {
        amount: toNumber(dto.salePriceAmount),
        currency: dto.salePriceCurrency || currency,
      },
      costPrice: {
        amount: toNumber(dto.costPriceAmount),
        currency: dto.costPriceCurrency || currency,
      },
      quantity: toNumber(dto.quantityCache),
      stockStatus: dto.stockStatus,
      barcode: dto.barcode ?? undefined,
      description: dto.description ?? undefined,
      ...toVariantMedia(dto.images, dto.imageUrl, dto.nameAr),
      isActive: dto.isActive,
    };
  });
}

/** Shape of `GET /public/inventory/products/:productId/variants` items. */
type PublicStoreVariantDto = {
  id: string;
  productId: string;
  combinationKey: string;
  sku: string;
  nameAr: string;
  description?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  salePriceAmount: string | number;
  salePriceCurrency?: string;
  stockStatus: ProductVariant['stockStatus'];
  attributes?: Array<{
    valueId: string;
    attributeNameAr: string;
    valueNameAr: string;
    colorHex?: string | null;
  }>;
};

/**
 * Map the public store variants payload into the product catalog graph
 * (variants + the attribute pickers derived from each variant's attributes).
 */
function mapPublicStoreVariantGraph(
  items: PublicStoreVariantDto[],
  productPrice: Product['price'],
): { variants: ProductVariant[]; attributes: ProductAttribute[] } {
  const attrOrder: string[] = [];
  const attrValues = new Map<string, Map<string, { nameAr: string; colorHex?: string }>>();

  for (const dto of items) {
    for (const attr of dto.attributes ?? []) {
      if (!attrValues.has(attr.attributeNameAr)) {
        attrValues.set(attr.attributeNameAr, new Map());
        attrOrder.push(attr.attributeNameAr);
      }
      const values = attrValues.get(attr.attributeNameAr)!;
      if (!values.has(attr.valueId)) {
        values.set(attr.valueId, {
          nameAr: attr.valueNameAr,
          colorHex: attr.colorHex ?? undefined,
        });
      }
    }
  }

  const attributes: ProductAttribute[] = attrOrder.map((nameAr) => {
    const values = attrValues.get(nameAr)!;
    const hasColor = [...values.values()].some((value) => Boolean(value.colorHex));
    return {
      id: `attr:${nameAr}`,
      nameAr,
      displayType: hasColor ? 'color' : 'select',
      createVariant: 'always',
      values: [...values.entries()].map(([id, value]) => ({
        id,
        nameAr: value.nameAr,
        colorHex: value.colorHex,
      })),
    };
  });

  const variants: ProductVariant[] = items.map((dto) => {
    const links = dto.attributes ?? [];
    const saleAmount = toNumber(dto.salePriceAmount);
    const currency = dto.salePriceCurrency || productPrice.currency;
    return {
      id: dto.id,
      combinationKey: dto.combinationKey,
      sku: dto.sku,
      nameAr: dto.nameAr,
      attributeValueIds: links.map((link) => link.valueId),
      attributeLabels: links.map((link) => ({
        attributeNameAr: link.attributeNameAr,
        valueNameAr: link.valueNameAr,
        colorHex: link.colorHex ?? undefined,
      })),
      // "0.0000" means "use the product base price".
      salePrice: saleAmount > 0 ? { amount: saleAmount, currency } : productPrice,
      costPrice: { amount: 0, currency },
      quantity: 0,
      stockStatus: dto.stockStatus,
      description: dto.description ?? undefined,
      ...toVariantMedia(dto.images, dto.imageUrl, dto.nameAr),
      isActive: true,
    };
  });

  return { variants, attributes };
}

/** Public (no-auth) variants for a product — titles, descriptions, and images. */
async function fetchPublicStoreVariantGraph(
  companyId: string,
  productId: string,
  productPrice: Product['price'],
): Promise<{ variants: ProductVariant[]; attributes: ProductAttribute[] } | null> {
  const data = await publicProductRequest<PublicStoreVariantDto[]>(
    `/public/inventory/products/${encodeURIComponent(productId)}/variants`,
    { companyId },
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  return mapPublicStoreVariantGraph(data, productPrice);
}

function mapPublicProduct(dto: PublicProductDto): Product {
  const currency = dto.priceCurrency || STORE_CURRENCY_CODE;
  const compareAmount =
    dto.compareAtPriceAmount != null && dto.compareAtPriceAmount !== ''
      ? toNumber(dto.compareAtPriceAmount)
      : undefined;
  const dealAmount =
    dto.dealPriceAmount != null && dto.dealPriceAmount !== ''
      ? toNumber(dto.dealPriceAmount)
      : undefined;
  const media =
    dto.primaryImageUrl != null && dto.primaryImageUrl !== ''
      ? [
          {
            id: `${dto.id}-primary`,
            url: dto.primaryImageUrl,
            alt: dto.primaryImageAlt || dto.nameAr,
            type: 'image' as const,
            position: 0,
            isPrimary: true,
          },
        ]
      : [];

  return {
    id: dto.id,
    companyId: dto.companyId,
    brandId: dto.brandId ?? null,
    categoryId: dto.categoryId ?? null,
    sku: dto.sku,
    slug: dto.slug,
    barcode: dto.barcode ?? undefined,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    description: dto.description ?? undefined,
    shortDescription: dto.shortDescription ?? undefined,
    status: dto.status,
    stockStatus: dto.stockStatus,
    productType: dto.productType,
    tracking: dto.tracking,
    invoicePolicy: dto.invoicePolicy,
    inventory: {
      trackInventory: dto.trackInventory,
      quantity:
        dto.availableQuantity != null && dto.availableQuantity !== ''
          ? toNumber(dto.availableQuantity)
          : toNumber(dto.quantityCache),
      lowStockThreshold: toNumber(dto.lowStockThreshold, 5),
      allowBackorder: dto.allowBackorder,
    },
    price: { amount: toNumber(dto.priceAmount), currency },
    compareAtPrice:
      compareAmount !== undefined
        ? { amount: compareAmount, currency: dto.compareAtPriceCurrency || currency }
        : undefined,
    media,
    seo: {
      metaTitle: dto.seoMetaTitle ?? undefined,
      metaDescription: dto.seoMetaDescription ?? undefined,
      canonicalPath: dto.seoCanonicalPath ?? undefined,
      ogImage: dto.seoOgImage ?? undefined,
      keywords: dto.seoKeywords ?? undefined,
    },
    tags: dto.tags ?? undefined,
    isNewProduct: Boolean(dto.isNewProduct),
    newUntil: dto.newUntil ?? null,
    isTodayDeal: Boolean(dto.isTodayDeal),
    dealPrice: dealAmount !== undefined ? { amount: dealAmount, currency } : undefined,
    dealDays: dto.dealDays != null && dto.dealDays !== '' ? toNumber(dto.dealDays) : null,
    dealUntil: dto.dealUntil ?? null,
    isWholesale: Boolean(dto.isWholesale),
    wholesalePrice:
      dto.wholesalePriceAmount != null && dto.wholesalePriceAmount !== ''
        ? { amount: toNumber(dto.wholesalePriceAmount), currency }
        : undefined,
    wholesaleUntil: dto.wholesaleUntil ?? null,
    isDiscounted: Boolean(dto.isDiscounted),
    discountPercent:
      dto.discountPercent != null && dto.discountPercent !== '' ? toNumber(dto.discountPercent) : null,
    discountUntil: dto.discountUntil ?? null,
    isNewProductActive: Boolean(dto.isNewProductActive),
    isTodayDealActive: Boolean(dto.isTodayDealActive),
    isWholesaleActive: Boolean(dto.isWholesaleActive),
    isDiscountActive: Boolean(dto.isDiscountActive),
    attributes: mapPublicAttributes(dto.attributes),
    variants: mapPublicVariants(dto.variants),
    rating: (() => {
      const raw = dto.ratingAvg ?? dto.rating_avg ?? dto.rating;
      if (raw == null || raw === '') return null;
      const value = toNumber(raw);
      return Number.isFinite(value) ? value : null;
    })(),
    reviewCount: Math.max(
      0,
      Math.floor(toNumber(dto.reviewCount ?? dto.review_count ?? 0)),
    ),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    archivedAt: dto.archivedAt ?? null,
  };
}

/**
 * Public list/detail payloads often omit nested attributes/variants.
 * Enrich from authenticated GET /inventory/products/:id/full when a session token exists.
 */
async function withCatalogGraph(
  companyId: string,
  product: Product,
  locale: StorefrontLocale,
): Promise<StorefrontProduct> {
  const hasGraph =
    (product.attributes?.length ?? 0) > 0 || (product.variants?.length ?? 0) > 0;
  if (hasGraph) {
    return mapStorefrontProduct(product, locale);
  }

  // Prefer the public (no-auth) variants endpoint — works for anonymous shoppers.
  try {
    const graph = await fetchPublicStoreVariantGraph(companyId, product.id, product.price);
    if (graph && graph.variants.length > 0) {
      return mapStorefrontProduct(
        { ...product, attributes: graph.attributes, variants: graph.variants },
        locale,
      );
    }
  } catch {
    // fall through to the authenticated full-product graph
  }

  // The full-graph endpoint is console-only. A shopper has no staff token, so
  // calling it just burns a request per product and answers 401 — which used
  // to bounce the whole cart page to a login screen. Only staff get here.
  const staffToken = await resolveAccessToken();
  if (!staffToken) return mapStorefrontProduct(product, locale);

  try {
    const full = await productsApi.getById(companyId, product.id);
    if (!full) return mapStorefrontProduct(product, locale);
    return mapStorefrontProduct(
      {
        ...product,
        media: full.media?.length ? full.media : product.media,
        attributes: full.attributes ?? [],
        variants: full.variants ?? [],
        inventory: full.inventory ?? product.inventory,
        stockStatus: full.stockStatus ?? product.stockStatus,
        price: full.price ?? product.price,
        compareAtPrice: full.compareAtPrice ?? product.compareAtPrice,
      },
      locale,
    );
  } catch {
    return mapStorefrontProduct(product, locale);
  }
}

function applyProductStockOverlay(
  product: StorefrontProduct,
  snapshot: ProductStockSnapshot,
): StorefrontProduct {
  if (!snapshot.trackInventory) return product;

  if (snapshot.displayLevel === 'variant' && product.variants.length > 0) {
    const variants = product.variants.map((variant) => {
      const row = snapshot.variants.find((item) => item.variantId === variant.id);
      if (!row) return variant;
      return { ...variant, quantity: row.available };
    });
    const quantity = variants.reduce((sum, variant) => sum + variant.quantity, 0);
    return {
      ...product,
      inventory: { ...product.inventory, quantity: quantity > 0 ? quantity : snapshot.available },
      variants,
    };
  }

  return {
    ...product,
    inventory: { ...product.inventory, quantity: snapshot.available },
  };
}

async function withPublicLiveStock(
  companyId: string,
  product: StorefrontProduct,
): Promise<StorefrontProduct> {
  const dto = await publicProductRequest<ProductStockDto>(
    `/public/inventory/products/${encodeURIComponent(product.id)}/stock`,
    { companyId },
  );
  if (!dto?.productId) return product;
  return applyProductStockOverlay(product, mapProductStockDto(dto));
}

function listQueryParams(query: StorefrontProductListQuery, companyId: string) {
  const sort = query.sort === 'stock' ? 'quantity' : query.sort;

  return {
    companyId,
    search: query.search,
    categoryId: query.categoryId,
    brandId: query.brandId,
    tags: query.tag,
    isNewProduct: query.isNewProduct === true ? true : undefined,
    isTodayDeal: query.isTodayDeal === true ? true : undefined,
    isWholesale: query.isWholesale === true ? true : undefined,
    isDiscounted: query.isDiscounted === true ? true : undefined,
    sort,
    sortDirection: query.sortDirection,
    page: query.page ?? 1,
    limit: query.limit ?? 24,
    priceAmountMin: query.minPrice,
    priceAmountMax: query.maxPrice,
    inStockOnly: query.inStockOnly !== false,
    includeQuantity: query.includeQuantity !== false,
  };
}

/** StorefrontProductsPort — public inventory products API (no auth). */
export const storefrontProductsRepository: StorefrontProductsPort = {
  async list(query: StorefrontProductListQuery): Promise<StorefrontPaginated<StorefrontProduct>> {
    const { locale, companyId } = query;
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await publicProductRequest<PaginatedProductDto>(
      '/public/inventory/products',
      listQueryParams(query, resolvedCompanyId),
    );

    const items = (result?.items ?? []).map(mapPublicProduct);
    return {
      items: mapStorefrontProducts(items, locale),
      pagination: result?.pagination ?? {
        page: query.page ?? 1,
        limit: query.limit ?? 24,
        total: 0,
        totalPages: 0,
      },
    };
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontProduct | null> {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const dto = await publicProductRequest<PublicProductDto>(
      `/public/inventory/products/by-slug/${encodeURIComponent(slug)}`,
      { companyId: resolvedCompanyId },
    );
    if (!dto?.id || dto.status !== 'active') return null;
    const product = await withCatalogGraph(resolvedCompanyId, mapPublicProduct(dto), locale);
    return withPublicLiveStock(resolvedCompanyId, product);
  },

  async getById(companyId: string, id: string, locale: StorefrontLocale): Promise<StorefrontProduct | null> {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await publicProductRequest<PaginatedProductDto>('/public/inventory/products', {
      companyId: resolvedCompanyId,
      id,
      page: 1,
      limit: 1,
    });
    const dto = result?.items?.[0];
    if (!dto?.id || dto.status !== 'active') return null;
    const product = await withCatalogGraph(resolvedCompanyId, mapPublicProduct(dto), locale);
    return withPublicLiveStock(resolvedCompanyId, product);
  },

  async getByIds(companyId: string, ids: string[], locale: StorefrontLocale): Promise<StorefrontProduct[]> {
    if (ids.length === 0) return [];
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const rows = await Promise.all(
      ids.map(async (id) => {
        const result = await publicProductRequest<PaginatedProductDto>('/public/inventory/products', {
          companyId: resolvedCompanyId,
          id,
          page: 1,
          limit: 1,
        });
        return result?.items?.[0] ?? null;
      }),
    );
    const byId = new Map(
      rows.filter((dto): dto is PublicProductDto => Boolean(dto?.id)).map((dto) => [dto.id, dto]),
    );
    return Promise.all(
      ids
        .map((id) => byId.get(id))
        .filter((dto): dto is PublicProductDto => Boolean(dto))
        .map((dto) => withCatalogGraph(resolvedCompanyId, mapPublicProduct(dto), locale)),
    );
  },
};

export type { StorefrontProductListQuery };

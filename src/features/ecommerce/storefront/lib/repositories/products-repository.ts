import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import type { Product, ProductAttribute, ProductVariant } from '@/features/ecommerce/domain/types/product';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontProductListQuery,
  StorefrontProductsPort,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import { logStorefrontApi } from '@/features/ecommerce/storefront/lib/debug-storefront-api';
import { mapStorefrontProduct, mapStorefrontProducts } from '@/features/ecommerce/storefront/lib/mappers/product-mapper';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { toNumber, toOptionalNumber } from '@/features/inventory/lib/api/numbers';

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
  barcode?: string | null;
  imageUrl?: string | null;
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
      cache: 'no-store',
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
      imageUrl: dto.imageUrl ?? undefined,
      isActive: dto.isActive,
    };
  });
}

function mapPublicProduct(dto: PublicProductDto): Product {
  // Storefront is YER-only (matches store settings + order validation).
  const currency = 'YER';
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
      quantity: toNumber(dto.quantityCache),
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
    rating:
      dto.ratingAvg == null || dto.ratingAvg === '' ? null : toNumber(dto.ratingAvg),
    reviewCount: Math.max(0, Math.floor(toNumber(dto.reviewCount))),
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

function listQueryParams(query: StorefrontProductListQuery, companyId: string) {
  const sort =
    query.sort === 'stock' || query.sort === undefined
      ? query.sort === 'stock'
        ? 'name'
        : undefined
      : query.sort;

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
    return withCatalogGraph(resolvedCompanyId, mapPublicProduct(dto), locale);
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
    return withCatalogGraph(resolvedCompanyId, mapPublicProduct(dto), locale);
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

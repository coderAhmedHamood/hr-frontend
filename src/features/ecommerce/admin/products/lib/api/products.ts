import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber, toOptionalNumber } from '@/features/inventory/lib/api/numbers';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import type {
  CreateProductInput,
  Product,
  ProductAttribute,
  ProductAttributeValue,
  ProductListQuery,
  ProductUomLine,
  ProductVariant,
  UpdateProductInput,
} from '@/features/ecommerce/domain/types/product';
import type { AdminProductsPort } from '@/features/ecommerce/domain/ports/catalog.ports';
import { buildCombinationKey } from '@/features/ecommerce/admin/products/lib/product-variants';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function maybeCatalogValueId(clientId: string): string | null {
  return UUID_RE.test(clientId) ? clientId : null;
}
type ProductDto = {
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
  costPriceAmount?: string | number | null;
  costPriceCurrency?: string | null;
  compareAtPriceAmount?: string | number | null;
  compareAtPriceCurrency?: string | null;
  trackInventory: boolean;
  quantityCache: string | number;
  lowStockThreshold: string | number;
  allowBackorder: boolean;
  weightKg?: string | number | null;
  lengthCm?: string | number | null;
  widthCm?: string | number | null;
  heightCm?: string | number | null;
  posAvailable?: boolean;
  saleOk?: boolean;
  purchaseOk?: boolean;
  tags?: string[] | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  seoCanonicalPath?: string | null;
  seoOgImage?: string | null;
  seoKeywords?: string[] | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type MediaDto = {
  id: string;
  productId: string;
  url: string;
  alt: string;
  type: MediaItem['type'];
  position: number;
  isPrimary: boolean;
  width?: number | null;
  height?: number | null;
};

type UomDto = {
  id: string;
  productId: string;
  nameAr: string;
  uneceCode?: string | null;
  relativeQuantity: string | number;
  isReference: boolean;
  packagingType: ProductUomLine['packagingType'];
  sortOrder?: number;
};

type AttrLineDto = {
  id: string;
  productId: string;
  catalogAttributeId?: string | null;
  nameAr: string;
  displayType: ProductAttribute['displayType'];
  createVariant: ProductAttribute['createVariant'];
  sortOrder?: number;
};

type AttrValueDto = {
  id: string;
  productAttributeLineId: string;
  catalogAttributeValueId?: string | null;
  nameAr: string;
  freeText?: string | null;
  defaultExtraPrice?: string | number | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

type VariantDto = {
  id: string;
  productId: string;
  combinationKey: string;
  sku: string;
  nameAr: string;
  barcode?: string | null;
  imageUrl?: string | null;
  salePriceAmount: string | number;
  salePriceCurrency: string;
  costPriceAmount: string | number;
  costPriceCurrency: string;
  quantityCache: string | number;
  stockStatus: ProductVariant['stockStatus'];
  isActive: boolean;
};

type VariantAttrDto = {
  id: string;
  variantId: string;
  productAttributeValueId: string;
  attributeNameAr: string;
  valueNameAr: string;
  colorHex?: string | null;
};

function mapCoreProduct(
  dto: ProductDto,
  extras?: {
    media?: MediaItem[];
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];
    uomLines?: ProductUomLine[];
  },
): Product {
  const currency = dto.priceCurrency || 'SAR';
  const costAmount = toOptionalNumber(dto.costPriceAmount);
  const compareAmount = toOptionalNumber(dto.compareAtPriceAmount);
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
    costPrice:
      costAmount !== undefined
        ? { amount: costAmount, currency: dto.costPriceCurrency || currency }
        : undefined,
    compareAtPrice:
      compareAmount !== undefined
        ? { amount: compareAmount, currency: dto.compareAtPriceCurrency || currency }
        : undefined,
    media: extras?.media ?? [],
    seo: {
      metaTitle: dto.seoMetaTitle ?? undefined,
      metaDescription: dto.seoMetaDescription ?? undefined,
      canonicalPath: dto.seoCanonicalPath ?? undefined,
      ogImage: dto.seoOgImage ?? undefined,
      keywords: dto.seoKeywords ?? undefined,
    },
    tags: dto.tags ?? undefined,
    weightKg: toOptionalNumber(dto.weightKg),
    dimensions: {
      lengthCm: toOptionalNumber(dto.lengthCm),
      widthCm: toOptionalNumber(dto.widthCm),
      heightCm: toOptionalNumber(dto.heightCm),
    },
    posAvailable: dto.posAvailable,
    saleOk: dto.saleOk,
    purchaseOk: dto.purchaseOk,
    attributes: extras?.attributes,
    variants: extras?.variants,
    uomLines: extras?.uomLines,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    archivedAt: dto.archivedAt ?? null,
  };
}

function toProductBody(input: CreateProductInput | UpdateProductInput, mode: 'create' | 'update') {
  const body: Record<string, unknown> = {};
  if (mode === 'create' && 'companyId' in input) body.companyId = input.companyId;
  if (input.brandId !== undefined) body.brandId = input.brandId;
  if (input.categoryId !== undefined) body.categoryId = input.categoryId;
  if (input.sku !== undefined) body.sku = input.sku;
  if (input.slug !== undefined) body.slug = input.slug || undefined;
  if (input.barcode !== undefined) body.barcode = input.barcode ?? null;
  if (input.nameAr !== undefined) body.nameAr = input.nameAr;
  if (input.nameEn !== undefined) body.nameEn = input.nameEn ?? null;
  if (input.description !== undefined) body.description = input.description ?? null;
  if (input.shortDescription !== undefined) body.shortDescription = input.shortDescription ?? null;
  if (input.status !== undefined) body.status = input.status;
  if (input.stockStatus !== undefined) body.stockStatus = input.stockStatus;
  if (input.productType !== undefined) body.productType = input.productType;
  if (input.tracking !== undefined) body.tracking = input.tracking;
  if (input.invoicePolicy !== undefined) body.invoicePolicy = input.invoicePolicy;
  if (input.price !== undefined) {
    body.priceAmount = input.price.amount;
    body.priceCurrency = input.price.currency;
  }
  if (input.costPrice !== undefined) {
    body.costPriceAmount = input.costPrice?.amount ?? null;
    body.costPriceCurrency = input.costPrice?.currency ?? null;
  }
  if (input.compareAtPrice !== undefined) {
    body.compareAtPriceAmount = input.compareAtPrice?.amount ?? null;
    body.compareAtPriceCurrency = input.compareAtPrice?.currency ?? null;
  }
  if (input.inventory !== undefined) {
    body.trackInventory = input.inventory.trackInventory;
    body.lowStockThreshold = input.inventory.lowStockThreshold;
    body.allowBackorder = input.inventory.allowBackorder;
    // quantityCache is backend-managed — do not send
  }
  if (input.weightKg !== undefined) body.weightKg = input.weightKg ?? null;
  if (input.dimensions !== undefined) {
    body.lengthCm = input.dimensions.lengthCm ?? null;
    body.widthCm = input.dimensions.widthCm ?? null;
    body.heightCm = input.dimensions.heightCm ?? null;
  }
  if (input.posAvailable !== undefined) body.posAvailable = input.posAvailable;
  if (input.saleOk !== undefined) body.saleOk = input.saleOk;
  if (input.purchaseOk !== undefined) body.purchaseOk = input.purchaseOk;
  if (input.tags !== undefined) body.tags = input.tags ?? null;
  if (input.seo !== undefined) {
    body.seoMetaTitle = input.seo.metaTitle ?? null;
    body.seoMetaDescription = input.seo.metaDescription ?? null;
    body.seoCanonicalPath = input.seo.canonicalPath ?? null;
    body.seoOgImage = input.seo.ogImage ?? null;
    body.seoKeywords = input.seo.keywords ?? null;
  }
  return body;
}

async function fetchMedia(productId: string): Promise<MediaItem[]> {
  const result = await apiRequest<PaginatedResult<MediaDto>>('/inventory/product-media', {
    query: { productId, page: 1, limit: 100, archiveScope: 'active' },
  });
  return (result.items ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((dto) => ({
      id: dto.id,
      url: dto.url,
      alt: dto.alt ?? '',
      type: dto.type,
      position: dto.position,
      isPrimary: dto.isPrimary,
      width: dto.width ?? undefined,
      height: dto.height ?? undefined,
    }));
}

async function fetchUomLines(productId: string): Promise<ProductUomLine[]> {
  const result = await apiRequest<PaginatedResult<UomDto>>('/inventory/product-uom-lines', {
    query: { productId, page: 1, limit: 100, archiveScope: 'active' },
  });
  return (result.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((dto) => ({
      id: dto.id,
      nameAr: dto.nameAr,
      uneceCode: dto.uneceCode ?? undefined,
      relativeQuantity: toNumber(dto.relativeQuantity, 1),
      isReference: dto.isReference,
      packagingType: dto.packagingType,
    }));
}

async function fetchAttributeValueDtos(productId: string): Promise<AttrValueDto[]> {
  const result = await apiRequest<PaginatedResult<AttrValueDto>>(
    '/inventory/product-attribute-values',
    { query: { productId, page: 1, limit: 500, archiveScope: 'active' } },
  );
  return result.items ?? [];
}

async function fetchAttributes(productId: string): Promise<ProductAttribute[]> {
  const lines = await apiRequest<PaginatedResult<AttrLineDto>>('/inventory/product-attribute-lines', {
    query: { productId, page: 1, limit: 100, archiveScope: 'active' },
  });
  const values = await fetchAttributeValueDtos(productId);
  const valuesByLine = new Map<string, ProductAttributeValue[]>();
  for (const dto of values) {
    const list = valuesByLine.get(dto.productAttributeLineId) ?? [];
    list.push({
      id: dto.id,
      nameAr: dto.nameAr,
      freeText: dto.freeText ?? undefined,
      defaultExtraPrice: toOptionalNumber(dto.defaultExtraPrice),
      colorHex: dto.colorHex ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
    });
    valuesByLine.set(dto.productAttributeLineId, list);
  }
  return (lines.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((line) => ({
      id: line.id,
      attributeId: line.catalogAttributeId ?? undefined,
      nameAr: line.nameAr,
      displayType: line.displayType,
      createVariant: line.createVariant,
      values: valuesByLine.get(line.id) ?? [],
    }));
}

function resolveProductAttributeValueId(
  clientValueId: string,
  lineValues: AttrValueDto[],
  claimedServerIds: Set<string>,
): AttrValueDto | undefined {
  const byId = lineValues.find((item) => item.id === clientValueId && !claimedServerIds.has(item.id));
  if (byId) return byId;
  return lineValues.find(
    (item) => item.catalogAttributeValueId === clientValueId && !claimedServerIds.has(item.id),
  );
}

/**
 * Syncs product attribute lines/values and returns a map of
 * client-side value ids (often catalog-attribute-value ids) → product-attribute-value ids.
 */
async function syncAttributes(
  productId: string,
  attributes: ProductAttribute[],
): Promise<Map<string, string>> {
  const valueIdMap = new Map<string, string>();
  const existing = await fetchAttributes(productId);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const keep = new Set(attributes.map((item) => item.id).filter((id) => existingById.has(id)));

  for (const item of existing) {
    if (!keep.has(item.id)) {
      await apiRequest<void>(`/inventory/product-attribute-lines/${item.id}`, { method: 'DELETE' });
    }
  }

  for (const [lineIndex, attr] of attributes.entries()) {
    let lineId = attr.id;
    const lineBody = {
      catalogAttributeId: attr.attributeId ?? null,
      nameAr: attr.nameAr,
      displayType: attr.displayType,
      createVariant: attr.createVariant,
      sortOrder: lineIndex,
    };

    if (existingById.has(attr.id)) {
      await apiRequest(`/inventory/product-attribute-lines/${attr.id}`, {
        method: 'PATCH',
        body: lineBody,
      });
    } else {
      const created = await apiRequest<AttrLineDto>('/inventory/product-attribute-lines', {
        method: 'POST',
        body: { productId, ...lineBody },
      });
      lineId = created.id;
    }

    const lineValueDtos = (await fetchAttributeValueDtos(productId)).filter(
      (dto) => dto.productAttributeLineId === lineId,
    );
    const claimedServerIds = new Set<string>();
    const keepServerIds = new Set<string>();

    for (const [valueIndex, value] of attr.values.entries()) {
      const valueBody = {
        nameAr: value.nameAr,
        freeText: value.freeText ?? null,
        defaultExtraPrice: value.defaultExtraPrice ?? null,
        colorHex: value.colorHex ?? null,
        imageUrl: value.imageUrl ?? null,
        sortOrder: valueIndex,
      };

      const matched = resolveProductAttributeValueId(value.id, lineValueDtos, claimedServerIds);
      if (matched) {
        claimedServerIds.add(matched.id);
        keepServerIds.add(matched.id);
        await apiRequest(`/inventory/product-attribute-values/${matched.id}`, {
          method: 'PATCH',
          body: valueBody,
        });
        valueIdMap.set(value.id, matched.id);
        continue;
      }

      const created = await apiRequest<AttrValueDto>('/inventory/product-attribute-values', {
        method: 'POST',
        body: {
          productAttributeLineId: lineId,
          catalogAttributeValueId: maybeCatalogValueId(value.id),
          ...valueBody,
        },
      });
      claimedServerIds.add(created.id);
      keepServerIds.add(created.id);
      lineValueDtos.push(created);
      valueIdMap.set(value.id, created.id);
    }

    for (const dto of lineValueDtos) {
      if (!keepServerIds.has(dto.id)) {
        await apiRequest<void>(`/inventory/product-attribute-values/${dto.id}`, {
          method: 'DELETE',
        });
      }
    }
  }

  return valueIdMap;
}

function remapVariantValueIds(
  valueIds: string[],
  valueIdMap: Map<string, string>,
): string[] {
  return valueIds.map((id) => valueIdMap.get(id) ?? id);
}

async function syncVariants(
  productId: string,
  variants: ProductVariant[],
  valueIdMap: Map<string, string>,
) {
  const existing = await fetchVariants(productId);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const keep = new Set(variants.map((item) => item.id).filter((id) => existingById.has(id)));

  for (const item of existing) {
    if (!keep.has(item.id)) {
      await apiRequest<void>(`/inventory/product-variants/${item.id}`, { method: 'DELETE' });
    }
  }

  for (const variant of variants) {
    const productAttributeValueIds = remapVariantValueIds(variant.attributeValueIds, valueIdMap);
    const body = {
      combinationKey: buildCombinationKey(productAttributeValueIds),
      sku: variant.sku,
      nameAr: variant.nameAr,
      barcode: variant.barcode ?? null,
      imageUrl: variant.imageUrl ?? null,
      salePriceAmount: variant.salePrice.amount,
      salePriceCurrency: variant.salePrice.currency,
      costPriceAmount: variant.costPrice.amount,
      costPriceCurrency: variant.costPrice.currency,
      stockStatus: variant.stockStatus,
      isActive: variant.isActive,
    };

    let variantId = variant.id;
    if (existingById.has(variant.id)) {
      await apiRequest(`/inventory/product-variants/${variant.id}`, { method: 'PATCH', body });
    } else {
      // Also try match by remapped combination key (catalog ids → product value ids).
      const byKey = existing.find((item) => item.combinationKey === body.combinationKey);
      if (byKey) {
        variantId = byKey.id;
        await apiRequest(`/inventory/product-variants/${byKey.id}`, { method: 'PATCH', body });
      } else {
        const created = await apiRequest<VariantDto>('/inventory/product-variants', {
          method: 'POST',
          body: { productId, ...body },
        });
        variantId = created.id;
      }
    }

    const existingLinks = await apiRequest<PaginatedResult<VariantAttrDto>>(
      '/inventory/product-variant-attribute-values',
      { query: { variantId, page: 1, limit: 100 } },
    );
    for (const link of existingLinks.items ?? []) {
      await apiRequest<void>(`/inventory/product-variant-attribute-values/${link.id}`, {
        method: 'DELETE',
      });
    }
    for (const [index, productAttributeValueId] of productAttributeValueIds.entries()) {
      const label = variant.attributeLabels[index];
      await apiRequest('/inventory/product-variant-attribute-values', {
        method: 'POST',
        body: {
          variantId,
          productAttributeValueId,
          attributeNameAr: label?.attributeNameAr,
          valueNameAr: label?.valueNameAr,
          colorHex: label?.colorHex ?? null,
        },
      });
    }
  }
}

async function syncNested(productId: string, input: CreateProductInput | UpdateProductInput) {
  if (input.media) await syncMedia(productId, input.media);
  if (input.uomLines) await syncUomLines(productId, input.uomLines);
  const valueIdMap =
    input.attributes !== undefined
      ? await syncAttributes(productId, input.attributes)
      : new Map<string, string>();
  if (input.variants) await syncVariants(productId, input.variants, valueIdMap);
}

async function fetchVariants(productId: string): Promise<ProductVariant[]> {
  const [variants, links] = await Promise.all([
    apiRequest<PaginatedResult<VariantDto>>('/inventory/product-variants', {
      query: { productId, page: 1, limit: 200, archiveScope: 'active' },
    }),
    apiRequest<PaginatedResult<VariantAttrDto>>('/inventory/product-variant-attribute-values', {
      query: { productId, page: 1, limit: 500 },
    }),
  ]);

  const linksByVariant = new Map<string, VariantAttrDto[]>();
  for (const link of links.items ?? []) {
    const list = linksByVariant.get(link.variantId) ?? [];
    list.push(link);
    linksByVariant.set(link.variantId, list);
  }

  return (variants.items ?? []).map((dto) => {
    const attrs = linksByVariant.get(dto.id) ?? [];
    return {
      id: dto.id,
      combinationKey: dto.combinationKey,
      sku: dto.sku,
      nameAr: dto.nameAr,
      attributeValueIds: attrs.map((a) => a.productAttributeValueId),
      attributeLabels: attrs.map((a) => ({
        attributeNameAr: a.attributeNameAr,
        valueNameAr: a.valueNameAr,
        colorHex: a.colorHex ?? undefined,
      })),
      salePrice: {
        amount: toNumber(dto.salePriceAmount),
        currency: dto.salePriceCurrency || 'SAR',
      },
      costPrice: {
        amount: toNumber(dto.costPriceAmount),
        currency: dto.costPriceCurrency || 'SAR',
      },
      quantity: toNumber(dto.quantityCache),
      stockStatus: dto.stockStatus,
      barcode: dto.barcode ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
      isActive: dto.isActive,
    };
  });
}

async function hydrateProduct(dto: ProductDto): Promise<Product> {
  const [media, attributes, variants, uomLines] = await Promise.all([
    fetchMedia(dto.id),
    fetchAttributes(dto.id),
    fetchVariants(dto.id),
    fetchUomLines(dto.id),
  ]);
  return mapCoreProduct(dto, { media, attributes, variants, uomLines });
}

async function syncMedia(productId: string, media: MediaItem[]) {
  const existing = await fetchMedia(productId);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const keep = new Set(media.map((item) => item.id).filter((id) => existingById.has(id)));

  for (const item of existing) {
    if (!keep.has(item.id)) {
      await apiRequest<void>(`/inventory/product-media/${item.id}`, { method: 'DELETE' });
    }
  }

  for (const [index, item] of media.entries()) {
    const body = {
      url: item.url,
      alt: item.alt ?? '',
      type: item.type ?? 'image',
      position: item.position ?? index,
      isPrimary: item.isPrimary,
      width: item.width ?? null,
      height: item.height ?? null,
    };
    if (existingById.has(item.id)) {
      await apiRequest(`/inventory/product-media/${item.id}`, { method: 'PATCH', body });
    } else if (item.url?.trim()) {
      await apiRequest('/inventory/product-media', {
        method: 'POST',
        body: { productId, ...body },
      });
    }
  }
}

async function syncUomLines(productId: string, lines: ProductUomLine[]) {
  const existing = await fetchUomLines(productId);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const keep = new Set(lines.map((item) => item.id).filter((id) => existingById.has(id)));

  for (const item of existing) {
    if (!keep.has(item.id)) {
      await apiRequest<void>(`/inventory/product-uom-lines/${item.id}`, { method: 'DELETE' });
    }
  }

  for (const [index, line] of lines.entries()) {
    const body = {
      nameAr: line.nameAr,
      uneceCode: line.uneceCode ?? null,
      relativeQuantity: line.relativeQuantity,
      isReference: line.isReference,
      packagingType: line.packagingType,
      sortOrder: index,
    };
    if (existingById.has(line.id)) {
      await apiRequest(`/inventory/product-uom-lines/${line.id}`, { method: 'PATCH', body });
    } else {
      await apiRequest('/inventory/product-uom-lines', {
        method: 'POST',
        body: { productId, ...body },
      });
    }
  }
}

export const productsApi: AdminProductsPort = {
  async getAll(query: ProductListQuery) {
    const result = await apiRequest<PaginatedResult<ProductDto>>('/inventory/products', {
      query: {
        companyId: query.companyId,
        search: query.search,
        categoryId: query.categoryId,
        brandId: query.brandId,
        status: query.status,
        stockStatus: query.stockStatus,
        tags: query.tag,
        priceAmountMin: query.minPrice,
        priceAmountMax: query.maxPrice,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: query.status === 'archived' ? 'archived' : 'active',
      },
    });

    // List view: hydrate media only for thumbnails; skip heavy attribute/variant trees.
    const items = await Promise.all(
      (result.items ?? []).map(async (dto) => {
        const media = await fetchMedia(dto.id);
        return mapCoreProduct(dto, { media });
      }),
    );

    if (query.sort) {
      const direction = query.sortDirection === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        switch (query.sort) {
          case 'name':
            return a.nameAr.localeCompare(b.nameAr) * direction;
          case 'price':
            return (a.price.amount - b.price.amount) * direction;
          case 'stock':
            return (a.inventory.quantity - b.inventory.quantity) * direction;
          case 'createdAt':
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
          case 'updatedAt':
            return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
          default:
            return 0;
        }
      });
    }

    return { items, pagination: result.pagination };
  },

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<ProductDto>(`/inventory/products/${id}`);
      return dto?.id ? hydrateProduct(dto) : null;
    } catch {
      return null;
    }
  },

  async getBySlug(companyId, slug) {
    const result = await apiRequest<PaginatedResult<ProductDto>>('/inventory/products', {
      query: { companyId, slug, page: 1, limit: 1, archiveScope: 'all' },
    });
    const dto = result.items?.[0];
    return dto ? hydrateProduct(dto) : null;
  },

  async create(input: CreateProductInput) {
    const dto = await apiRequest<ProductDto>('/inventory/products', {
      method: 'POST',
      body: toProductBody(input, 'create'),
    });
    await syncNested(dto.id, input);
    return hydrateProduct(dto);
  },

  async update(_companyId, id, patch: UpdateProductInput) {
    const body = toProductBody(patch, 'update');
    let dto: ProductDto | null = null;
    if (Object.keys(body).length > 0) {
      dto = await apiRequest<ProductDto>(`/inventory/products/${id}`, {
        method: 'PATCH',
        body,
      });
    } else {
      dto = await apiRequest<ProductDto>(`/inventory/products/${id}`);
    }
    if (!dto?.id) return null;
    await syncNested(id, patch);
    return hydrateProduct(dto);
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/products/${id}`, { method: 'DELETE' });
    return true;
  },

  async duplicate(companyId, id) {
    const source = await this.getById(companyId, id);
    if (!source) return null;
    const suffix = Math.random().toString(36).slice(2, 6);
    return this.create({
      ...source,
      sku: `${source.sku}-copy-${suffix}`,
      slug: `${source.slug}-copy-${suffix}`,
      status: 'draft',
      media: source.media.map((item) => ({ ...item, id: `tmp-${item.id}` })),
      attributes: source.attributes?.map((attr) => ({
        ...attr,
        id: `tmp-${attr.id}`,
        values: attr.values.map((value) => ({ ...value, id: `tmp-${value.id}` })),
      })),
      variants: source.variants?.map((variant) => ({
        ...variant,
        id: `tmp-${variant.id}`,
        sku: `${variant.sku}-copy-${suffix}`,
      })),
      uomLines: source.uomLines?.map((line) => ({ ...line, id: `tmp-${line.id}` })),
    });
  },

  async archive(companyId, id) {
    return this.update(companyId, id, { status: 'archived' });
  },

  async unarchive(companyId, id) {
    return this.update(companyId, id, { status: 'active' });
  },

  async bulkUpdateStatus(companyId, ids, status) {
    const updated: Product[] = [];
    for (const id of ids) {
      const item = await this.update(companyId, id, { status });
      if (item) updated.push(item);
    }
    return updated;
  },

  async bulkRemove(companyId, ids) {
    let count = 0;
    for (const id of ids) {
      if (await this.remove(companyId, id)) count += 1;
    }
    return count;
  },
};

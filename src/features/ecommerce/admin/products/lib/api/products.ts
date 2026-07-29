import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber, toOptionalNumber } from '@/features/inventory/lib/api/numbers';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPersistedId(id: string | undefined): boolean {
  return Boolean(id && UUID_RE.test(id));
}

/** Empty / placeholder → null; non-UUID strings are cleared so Nest validation does not 400. */
function normalizeOptionalUuid(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '__none__' || !UUID_RE.test(trimmed)) return null;
  return trimmed;
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
  nameAr: string;
  uneceCode?: string | null;
  relativeQuantity: string | number;
  isReference: boolean;
  packagingType: ProductUomLine['packagingType'];
  sortOrder?: number;
};

type AttrValueDto = {
  id: string;
  catalogAttributeValueId?: string | null;
  nameAr: string;
  freeText?: string | null;
  defaultExtraPrice?: string | number | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

type AttrLineDto = {
  id: string;
  catalogAttributeId?: string | null;
  nameAr: string;
  displayType: ProductAttribute['displayType'];
  createVariant: ProductAttribute['createVariant'];
  sortOrder?: number;
  values?: AttrValueDto[];
};

type VariantLinkDto = {
  id: string;
  productAttributeValueId: string;
  attributeNameAr: string;
  valueNameAr: string;
  colorHex?: string | null;
};

type VariantDto = {
  id: string;
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
  attributeValueIds?: string[];
  attributeLinks?: VariantLinkDto[];
};

type ProductFullDto = ProductDto & {
  media?: MediaDto[];
  uomLines?: UomDto[];
  attributes?: AttrLineDto[];
  variants?: VariantDto[];
  idMap?: Record<string, string>;
};

function mapMedia(items: MediaDto[] | undefined): MediaItem[] {
  return (items ?? [])
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

function mapUomLines(items: UomDto[] | undefined): ProductUomLine[] {
  return (items ?? [])
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

function mapAttributes(items: AttrLineDto[] | undefined): ProductAttribute[] {
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
        .map(
          (value): ProductAttributeValue => ({
            id: value.id,
            nameAr: value.nameAr,
            freeText: value.freeText ?? undefined,
            defaultExtraPrice: toOptionalNumber(value.defaultExtraPrice),
            colorHex: value.colorHex ?? undefined,
            imageUrl: value.imageUrl ?? undefined,
            catalogAttributeValueId: value.catalogAttributeValueId ?? undefined,
          }),
        ),
    }));
}

function mapVariants(items: VariantDto[] | undefined): ProductVariant[] {
  return (items ?? []).map((dto) => {
    const links = dto.attributeLinks ?? [];
    const attributeValueIds =
      dto.attributeValueIds ?? links.map((link) => link.productAttributeValueId);
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

function mapFullProduct(dto: ProductFullDto): Product {
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
    media: mapMedia(dto.media),
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
    attributes: mapAttributes(dto.attributes),
    variants: mapVariants(dto.variants),
    uomLines: mapUomLines(dto.uomLines),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    archivedAt: dto.archivedAt ?? null,
  };
}

function toHeaderBody(input: CreateProductInput | UpdateProductInput, mode: 'create' | 'update') {
  const body: Record<string, unknown> = {};
  if (mode === 'create' && 'companyId' in input) body.companyId = input.companyId;
  if (input.brandId !== undefined) body.brandId = normalizeOptionalUuid(input.brandId);
  if (input.categoryId !== undefined) body.categoryId = normalizeOptionalUuid(input.categoryId);
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

function refKey(id: string, prefix: string, index: number) {
  return isPersistedId(id) ? id : id || `${prefix}-${index}`;
}

function toFullBody(input: CreateProductInput | UpdateProductInput, mode: 'create' | 'update') {
  const body = toHeaderBody(input, mode);

  if (input.media !== undefined) {
    body.media = input.media.map((item, index) => {
      const persisted = mode === 'update' && isPersistedId(item.id);
      return {
        ...(persisted ? { id: item.id } : { clientKey: refKey(item.id, 'm', index) }),
        url: item.url,
        alt: item.alt ?? '',
        type: item.type ?? 'image',
        position: item.position ?? index,
        isPrimary: item.isPrimary,
        width: item.width ?? null,
        height: item.height ?? null,
      };
    });
  }

  if (input.uomLines !== undefined) {
    body.uomLines = input.uomLines.map((line, index) => {
      const persisted = mode === 'update' && isPersistedId(line.id);
      return {
        ...(persisted ? { id: line.id } : { clientKey: refKey(line.id, 'u', index) }),
        nameAr: line.nameAr,
        uneceCode: line.uneceCode ?? null,
        relativeQuantity: line.relativeQuantity,
        isReference: line.isReference,
        packagingType: line.packagingType,
        sortOrder: index,
      };
    });
  }

  if (input.attributes !== undefined) {
    body.attributes = input.attributes.map((attr, attrIndex) => {
      const linePersisted = mode === 'update' && isPersistedId(attr.id);
      return {
        ...(linePersisted ? { id: attr.id } : { clientKey: refKey(attr.id, 'a', attrIndex) }),
        catalogAttributeId: attr.attributeId ?? null,
        nameAr: attr.nameAr,
        displayType: attr.displayType,
        createVariant: attr.createVariant,
        sortOrder: attrIndex,
        values: attr.values.map((value, valueIndex) => {
          const valuePersisted = mode === 'update' && isPersistedId(value.id);
          const catalogAttributeValueId =
            value.catalogAttributeValueId ??
            (!valuePersisted && isPersistedId(value.id) ? value.id : null);
          return {
            ...(valuePersisted
              ? { id: value.id }
              : { clientKey: refKey(value.id, `v${attrIndex}`, valueIndex) }),
            catalogAttributeValueId,
            nameAr: value.nameAr,
            freeText: value.freeText ?? null,
            defaultExtraPrice: value.defaultExtraPrice ?? null,
            colorHex: value.colorHex ?? null,
            imageUrl: value.imageUrl ?? null,
            sortOrder: valueIndex,
          };
        }),
      };
    });
  }

  if (input.variants !== undefined) {
    const valueKeyByFormId = new Map<string, string>();
    for (const [attrIndex, attr] of (input.attributes ?? []).entries()) {
      for (const [valueIndex, value] of attr.values.entries()) {
        const valuePersisted = mode === 'update' && isPersistedId(value.id);
        const key = valuePersisted
          ? value.id
          : refKey(value.id, `v${attrIndex}`, valueIndex);
        valueKeyByFormId.set(value.id, key);
      }
    }

    body.variants = input.variants.map((variant, index) => {
      const persisted = mode === 'update' && isPersistedId(variant.id);
      const attributeValueIds: string[] = [];
      const attributeValueClientKeys: string[] = [];

      for (const formValueId of variant.attributeValueIds) {
        const mapped = valueKeyByFormId.get(formValueId) ?? formValueId;
        if (mode === 'update' && isPersistedId(formValueId) && mapped === formValueId) {
          attributeValueIds.push(formValueId);
        } else {
          attributeValueClientKeys.push(mapped);
        }
      }

      return {
        ...(persisted ? { id: variant.id } : { clientKey: refKey(variant.id, 'var', index) }),
        combinationKey: variant.combinationKey,
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
        ...(attributeValueIds.length > 0 ? { attributeValueIds } : {}),
        ...(attributeValueClientKeys.length > 0 ? { attributeValueClientKeys } : {}),
      };
    });
  }

  return body;
}

async function fetchProductFull(id: string): Promise<Product | null> {
  try {
    const dto = await apiRequest<ProductFullDto>(`/inventory/products/${id}/full`);
    return dto?.id ? mapFullProduct(dto) : null;
  } catch {
    return null;
  }
}

async function fetchMediaByCompany(companyId: string): Promise<Map<string, MediaDto[]>> {
  const result = await apiRequest<PaginatedResult<MediaDto>>('/inventory/product-media', {
    query: { companyId, page: 1, limit: 2000, archiveScope: 'active' },
  });
  const byProduct = new Map<string, MediaDto[]>();
  for (const dto of result.items ?? []) {
    const list = byProduct.get(dto.productId);
    if (list) list.push(dto);
    else byProduct.set(dto.productId, [dto]);
  }
  return byProduct;
}

export const productsApi: AdminProductsPort = {
  async getAll(query: ProductListQuery) {
    const companyId = resolveStorefrontCompanyId(query.companyId);
    const result = await apiRequest<PaginatedResult<ProductDto>>('/inventory/products', {
      query: {
        companyId,
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

    const mediaByProduct = await fetchMediaByCompany(companyId);
    const items = (result.items ?? []).map((dto) => {
      const media = mediaByProduct.get(dto.id) ?? [];
      return mapFullProduct({ ...dto, media, attributes: [], variants: [], uomLines: [] });
    });

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
    return fetchProductFull(id);
  },

  async getBySlug(companyId, slug) {
    const result = await apiRequest<PaginatedResult<ProductDto>>('/inventory/products', {
      query: {
        companyId: resolveStorefrontCompanyId(companyId),
        slug,
        page: 1,
        limit: 1,
        archiveScope: 'all',
      },
    });
    const dto = result.items?.[0];
    return dto?.id ? fetchProductFull(dto.id) : null;
  },

  async create(input: CreateProductInput) {
    const dto = await apiRequest<ProductFullDto>('/inventory/products/full', {
      method: 'POST',
      body: toFullBody(
        { ...input, companyId: resolveStorefrontCompanyId(input.companyId) },
        'create',
      ),
    });
    return mapFullProduct(dto);
  },

  async update(_companyId, id, patch: UpdateProductInput) {
    const dto = await apiRequest<ProductFullDto>(`/inventory/products/${id}/full`, {
      method: 'PATCH',
      body: toFullBody(patch, 'update'),
    });
    return dto?.id ? mapFullProduct(dto) : null;
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
        values: attr.values.map((value) => ({
          ...value,
          id: `tmp-${value.id}`,
          catalogAttributeValueId: value.catalogAttributeValueId,
        })),
      })),
      variants: source.variants?.map((variant) => ({
        ...variant,
        id: `tmp-${variant.id}`,
        sku: `${variant.sku}-copy-${suffix}`,
        attributeValueIds: variant.attributeValueIds.map((valueId) => `tmp-${valueId}`),
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

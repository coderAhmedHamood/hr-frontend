import type { CreateProductInput, Product, ProductVariant } from '@/features/ecommerce/domain/types/product';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import { normalizeAttributeValue } from '@/features/ecommerce/domain/types/catalog-attribute';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  createDefaultUomLines,
  PRODUCT_FORM_DEFAULT_VALUES,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  syncProductVariants,
  totalVariantQuantity,
} from '@/features/ecommerce/admin/products/lib/product-variants';

const PRODUCT_STATUSES = new Set<ProductStatus>(['draft', 'active', 'archived']);
const STOCK_STATUSES = new Set<StockStatus>(['in_stock', 'out_of_stock', 'preorder', 'discontinued']);

function coerceProductStatus(value: unknown): ProductStatus {
  return typeof value === 'string' && PRODUCT_STATUSES.has(value as ProductStatus)
    ? (value as ProductStatus)
    : 'active';
}

function coerceStockStatus(value: unknown): StockStatus {
  return typeof value === 'string' && STOCK_STATUSES.has(value as StockStatus)
    ? (value as StockStatus)
    : 'in_stock';
}

function parseTagsInput(tagsInput: string | undefined): string[] | undefined {
  const tags = (tagsInput ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

function formatTagsForInput(tags: string[] | undefined): string {
  return tags?.join(', ') ?? '';
}

function optionalPositive(value: number | undefined): number | undefined {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  return value;
}

/** ISO datetime → YYYY-MM-DD for date pickers. */
function isoToYmd(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  return match?.[1] ?? '';
}

/** YYYY-MM-DD → ISO midnight UTC, or null when empty (no expiry). */
function ymdToIso(ymd: string | null | undefined): string | null {
  const trimmed = ymd?.trim();
  if (!trimmed) return null;
  return `${trimmed}T00:00:00.000Z`;
}

/** Select "none" / empty → null so the API never receives "" or placeholders. */
function optionalRelationId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '__none__') return null;
  return trimmed;
}

function variantToForm(variant: ProductVariant) {
  return {
    id: variant.id,
    combinationKey: variant.combinationKey,
    sku: variant.sku,
    nameAr: variant.nameAr,
    attributeValueIds: variant.attributeValueIds,
    attributeLabels: variant.attributeLabels,
    salePrice: variant.salePrice.amount,
    costPrice: variant.costPrice.amount,
    quantity: variant.quantity,
    stockStatus: variant.stockStatus,
    barcode: variant.barcode ?? '',
    imageUrl: variant.imageUrl ?? '',
    images:
      variant.images && variant.images.length > 0
        ? variant.images.map((item) => item.url)
        : variant.imageUrl
          ? [variant.imageUrl]
          : [],
    isActive: variant.isActive,
  };
}

function formVariantToDomain(
  variant: ProductFormValues['variants'][number],
  currency: string,
): ProductVariant {
  const quantity = variant.quantity;
  return {
    id: variant.id,
    combinationKey: variant.combinationKey,
    sku: variant.sku,
    nameAr: variant.nameAr,
    attributeValueIds: variant.attributeValueIds,
    attributeLabels: variant.attributeLabels,
    salePrice: { amount: variant.salePrice, currency },
    costPrice: { amount: variant.costPrice, currency },
    quantity,
    stockStatus:
      variant.stockStatus === 'preorder' || variant.stockStatus === 'discontinued'
        ? variant.stockStatus
        : quantity > 0
          ? 'in_stock'
          : 'out_of_stock',
    barcode: variant.barcode || undefined,
    imageUrl: (variant.images?.[0] ?? variant.imageUrl)?.trim() || undefined,
    images: (variant.images ?? []).filter((url) => url.trim().length > 0).map((url, index) => ({
      id: `variant-image-${index}`,
      url,
      alt: '',
      type: 'image' as const,
      position: index,
      isPrimary: index === 0,
    })),
    isActive: variant.isActive,
  };
}

/** Maps an existing product into form values for the edit dialog. */
export function productToFormValues(product: Product): ProductFormInput {
  return {
    sku: product.sku,
    nameAr: product.nameAr,
    nameEn: product.nameEn ?? '',
    slug: product.slug,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId ?? undefined,
    brandId: product.brandId ?? undefined,
    /** Only accept known enum values — invalid/missing values leave Radix Select blank. */
    status: coerceProductStatus(product.status),
    stockStatus: coerceStockStatus(product.stockStatus),
    stockQuantity: product.inventory.quantity,
    trackInventory: product.inventory.trackInventory,
    allowBackorder: product.inventory.allowBackorder,
    lowStockThreshold: product.inventory.lowStockThreshold ?? 5,
    tagsInput: formatTagsForInput(product.tags),
    media: [...product.media]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ url: item.url, alt: item.alt, isPrimary: item.isPrimary })),
    metaTitle: product.seo.metaTitle ?? '',
    metaDescription: product.seo.metaDescription ?? '',
    productType: product.productType ?? 'goods',
    tracking: product.tracking ?? 'none',
    invoicePolicy: product.invoicePolicy ?? 'ordered',
    listPrice: product.price.amount,
    costPrice: product.costPrice?.amount ?? 0,
    compareAtPrice: product.compareAtPrice?.amount,
    barcode: product.barcode ?? '',
    weightKg: product.weightKg,
    lengthCm: product.dimensions?.lengthCm,
    widthCm: product.dimensions?.widthCm,
    heightCm: product.dimensions?.heightCm,
    posAvailable: product.posAvailable ?? false,
    saleOk: product.saleOk ?? true,
    purchaseOk: product.purchaseOk ?? true,
    isNewProduct: product.isNewProduct ?? false,
    newUntil: isoToYmd(product.newUntil),
    isTodayDeal: product.isTodayDeal ?? false,
    dealPriceAmount: product.dealPrice?.amount,
    dealDays: product.dealDays ?? undefined,
    dealUntil: isoToYmd(product.dealUntil),
    isWholesale: product.isWholesale ?? false,
    wholesalePriceAmount: product.wholesalePrice?.amount,
    wholesaleUntil: isoToYmd(product.wholesaleUntil),
    isDiscounted: product.isDiscounted ?? false,
    discountPercent: product.discountPercent ?? undefined,
    discountUntil: isoToYmd(product.discountUntil),
    attributes: (product.attributes ?? []).map((attribute) => ({
      ...attribute,
      values: attribute.values.map((value) => ({
        ...normalizeAttributeValue(value, attribute.displayType),
        catalogAttributeValueId: value.catalogAttributeValueId,
      })),
    })),
    variants: (product.variants ?? []).map(variantToForm),
    uomLines:
      product.uomLines && product.uomLines.length > 0
        ? product.uomLines
        : createDefaultUomLines(),
  };
}

type MappingOptions = {
  /** Used to preserve currency when editing. */
  existing?: Product | null;
};

/** Maps form values back into the API's create-input shape (companyId is injected by the caller). */
export function formValuesToCreateInput(
  values: ProductFormValues,
  companyId: string,
  options?: MappingOptions,
): CreateProductInput {
  const hasPrimary = values.media.some((item) => item.isPrimary);
  const media: MediaItem[] = values.media.map((item, index) => ({
    id: `media-${Math.random().toString(36).slice(2, 10)}`,
    url: item.url,
    alt: item.alt || values.nameAr,
    type: 'image',
    position: index,
    isPrimary: hasPrimary ? item.isPrimary : index === 0,
  }));

  const existing = options?.existing;
  const currency = existing?.price.currency ?? 'YER';

  const synced = syncProductVariants({
    productNameAr: values.nameAr,
    productSku: values.sku,
    listPrice: values.listPrice,
    costPrice: values.costPrice,
    currency,
    attributes: values.attributes,
    existing: values.variants.map((variant) => formVariantToDomain(variant, currency)),
    defaultStockStatus: values.stockStatus,
  }).map((variant) => {
    const formRow = values.variants.find((row) => row.combinationKey === variant.combinationKey);
    if (!formRow) return variant;
    return formVariantToDomain(formRow, currency);
  });

  const hasVariants = synced.length > 0;
  const quantity = hasVariants ? totalVariantQuantity(synced) : values.stockQuantity;
  const stockStatus = hasVariants
    ? synced.some((variant) => variant.isActive && variant.stockStatus === 'in_stock')
      ? 'in_stock'
      : synced.some((variant) => variant.isActive && variant.stockStatus === 'preorder')
        ? 'preorder'
        : 'out_of_stock'
    : values.stockStatus;

  const lengthCm = optionalPositive(values.lengthCm);
  const widthCm = optionalPositive(values.widthCm);
  const heightCm = optionalPositive(values.heightCm);
  const hasDimensions =
    lengthCm !== undefined || widthCm !== undefined || heightCm !== undefined;

  return {
    companyId,
    sku: values.sku,
    nameAr: values.nameAr,
    nameEn: values.nameEn || undefined,
    slug: values.slug,
    shortDescription: values.shortDescription || undefined,
    description: values.description || undefined,
    categoryId: optionalRelationId(values.categoryId),
    brandId: optionalRelationId(values.brandId),
    status: values.status,
    stockStatus,
    inventory: {
      trackInventory: values.trackInventory,
      quantity,
      lowStockThreshold: values.lowStockThreshold,
      allowBackorder: values.allowBackorder,
    },
    price: { amount: values.listPrice, currency },
    costPrice: { amount: values.costPrice, currency },
    compareAtPrice:
      values.compareAtPrice !== undefined && values.compareAtPrice > 0
        ? { amount: values.compareAtPrice, currency }
        : undefined,
    media,
    seo: {
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    },
    tags: parseTagsInput(values.tagsInput),
    productType: values.productType,
    tracking: values.tracking,
    invoicePolicy: values.invoicePolicy,
    barcode: values.barcode || undefined,
    weightKg: optionalPositive(values.weightKg),
    dimensions: hasDimensions
      ? { lengthCm, widthCm, heightCm }
      : undefined,
    posAvailable: values.posAvailable,
    saleOk: values.saleOk,
    purchaseOk: values.purchaseOk,
    isNewProduct: values.isNewProduct,
    newUntil: values.isNewProduct ? ymdToIso(values.newUntil) : null,
    isTodayDeal: values.isTodayDeal,
    dealPrice:
      values.isTodayDeal && values.dealPriceAmount != null
        ? { amount: values.dealPriceAmount, currency }
        : undefined,
    dealDays: values.isTodayDeal && values.dealDays != null ? values.dealDays : null,
    dealUntil: values.isTodayDeal ? ymdToIso(values.dealUntil) : null,
    isWholesale: values.isWholesale,
    wholesalePrice:
      values.isWholesale && values.wholesalePriceAmount != null
        ? { amount: values.wholesalePriceAmount, currency }
        : undefined,
    wholesaleUntil: values.isWholesale ? ymdToIso(values.wholesaleUntil) : null,
    isDiscounted: values.isDiscounted,
    discountPercent:
      values.isDiscounted && values.discountPercent != null ? values.discountPercent : null,
    discountUntil: values.isDiscounted ? ymdToIso(values.discountUntil) : null,
    attributes: values.attributes,
    variants: synced,
    uomLines: values.uomLines.map((line) => ({
      ...line,
      uneceCode: line.uneceCode || undefined,
    })),
  };
}

export { PRODUCT_FORM_DEFAULT_VALUES };

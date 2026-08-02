import type { CreateProductInput, Product, ProductVariant } from '@/features/ecommerce/domain/types/product';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import { normalizeAttributeValue } from '@/features/ecommerce/domain/types/catalog-attribute';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  createDefaultUomLines,
  PRODUCT_FORM_DEFAULT_VALUES,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  syncProductVariants,
  totalVariantQuantity,
} from '@/features/ecommerce/admin/products/lib/product-variants';

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
    imageUrl: variant.imageUrl?.trim() || undefined,
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
    status: product.status,
    stockStatus: product.stockStatus,
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
    attributes: (product.attributes ?? []).map((attribute) => ({
      ...attribute,
      values: attribute.values.map((value) =>
        normalizeAttributeValue(value, attribute.displayType),
      ),
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
  const currency = existing?.price.currency ?? 'SAR';

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
    categoryId: values.categoryId ?? null,
    brandId: values.brandId ?? null,
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
    attributes: values.attributes,
    variants: synced,
    uomLines: values.uomLines.map((line) => ({
      ...line,
      uneceCode: line.uneceCode || undefined,
    })),
  };
}

export { PRODUCT_FORM_DEFAULT_VALUES };

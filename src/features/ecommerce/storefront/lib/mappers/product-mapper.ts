import type { Product } from '@/features/ecommerce/domain/types/product';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedText, type LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import { cheapestActiveVariant } from '@/features/ecommerce/admin/products/lib/product-variants';

type ProductRecord = Product & {
  name?: LocalizableString;
  description?: LocalizableString;
};

function resolveName(product: Product, locale: StorefrontLocale): string {
  const record = product as ProductRecord;
  if (record.name) return resolveLocalizedText(record.name, locale);
  return locale === 'en' && product.nameEn ? product.nameEn : product.nameAr;
}

function resolveDescription(product: Product, locale: StorefrontLocale): string {
  const record = product as ProductRecord;
  if (record.description && typeof record.description === 'object') {
    return resolveLocalizedText(record.description as LocalizableString, locale);
  }
  if (typeof product.description === 'string') return product.description;
  return resolveName(product, locale);
}

export function mapStorefrontProduct(product: Product, locale: StorefrontLocale): StorefrontProduct {
  const primary = product.media.find((item) => item.isPrimary) ?? product.media[0] ?? null;
  const name = resolveName(product, locale);
  const variants = (product.variants ?? [])
    .filter((variant) => variant.isActive)
    .map((variant) => ({
      id: variant.id,
      combinationKey: variant.combinationKey,
      sku: variant.sku,
      nameAr: variant.nameAr,
      attributeValueIds: variant.attributeValueIds,
      attributeLabels: variant.attributeLabels,
      price: variant.salePrice,
      quantity: variant.quantity,
      stockStatus: variant.stockStatus,
      isActive: variant.isActive,
    }));
  const cheapest = cheapestActiveVariant(product.variants ?? []);
  const displayPrice = cheapest?.salePrice ?? product.price;
  const hasInStockVariant = variants.some((variant) => variant.stockStatus === 'in_stock');
  const stockStatus =
    variants.length > 0
      ? hasInStockVariant
        ? 'in_stock'
        : variants.some((v) => v.stockStatus === 'preorder')
          ? 'preorder'
          : 'out_of_stock'
      : product.stockStatus;

  return {
    id: product.id,
    companyId: product.companyId,
    slug: product.slug,
    sku: product.sku,
    name,
    description: resolveDescription(product, locale),
    brandId: product.brandId ?? null,
    categoryId: product.categoryId ?? null,
    status: product.status,
    stockStatus,
    inventory: {
      ...product.inventory,
      quantity:
        variants.length > 0
          ? variants.reduce((sum, variant) => sum + variant.quantity, 0)
          : product.inventory.quantity,
    },
    price: displayPrice,
    compareAtPrice: product.compareAtPrice ?? null,
    media: product.media,
    imageUrl: primary?.url ?? null,
    imageAlt: primary?.alt || name,
    tags: product.tags ?? [],
    metaTitle: product.seo.metaTitle || name,
    metaDescription: product.seo.metaDescription || resolveDescription(product, locale),
    attributes: (product.attributes ?? [])
      .filter((attribute) => attribute.createVariant !== 'never')
      .map((attribute) => ({
        id: attribute.id,
        nameAr: attribute.nameAr,
        displayType: attribute.displayType,
        values: attribute.values.map((value) => ({
          id: value.id,
          nameAr: value.nameAr,
          colorHex: value.colorHex,
          imageUrl: value.imageUrl,
        })),
      })),
    variants,
  };
}

export function mapStorefrontProducts(products: Product[], locale: StorefrontLocale): StorefrontProduct[] {
  return products.map((product) => mapStorefrontProduct(product, locale));
}

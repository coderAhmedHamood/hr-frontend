import type {
  ProductAttribute,
  ProductVariant,
} from '@/features/ecommerce/domain/types/product';
import type { Money } from '@/features/ecommerce/domain/types/common';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((prefix) => curr.map((item) => [...prefix, item])),
    [[]],
  );
}

export function buildCombinationKey(valueIds: string[]): string {
  return [...valueIds].sort().join('|');
}

function stockStatusFromQty(quantity: number, fallback: StockStatus = 'in_stock'): StockStatus {
  if (quantity > 0) return 'in_stock';
  if (fallback === 'preorder' || fallback === 'discontinued') return fallback;
  return 'out_of_stock';
}

type SyncArgs = {
  productNameAr: string;
  productSku: string;
  listPrice: number;
  costPrice: number;
  currency?: string;
  attributes: ProductAttribute[];
  existing?: ProductVariant[];
  /** Default stock status for newly created variants with qty 0 */
  defaultStockStatus?: StockStatus;
};

/**
 * Rebuild variants from attribute lines where `createVariant !== 'never'`.
 * Preserves sale/cost/qty/barcode/image for matching `combinationKey`.
 */
export function syncProductVariants(args: SyncArgs): ProductVariant[] {
  const currency = args.currency ?? 'SAR';
  const variantAttrs = args.attributes.filter(
    (attribute) => attribute.createVariant !== 'never' && attribute.values.length > 0,
  );

  if (variantAttrs.length === 0) return [];

  const valueSets = variantAttrs.map((attribute) =>
    attribute.values.map((value) => ({
      attributeNameAr: attribute.nameAr,
      valueId: value.id,
      valueNameAr: value.nameAr,
      colorHex: value.colorHex,
      extraPrice: value.defaultExtraPrice ?? 0,
    })),
  );

  const combos = cartesian(valueSets);
  const existingByKey = new Map((args.existing ?? []).map((variant) => [variant.combinationKey, variant]));

  return combos.map((combo) => {
    const attributeValueIds = combo.map((item) => item.valueId);
    const combinationKey = buildCombinationKey(attributeValueIds);
    const existing = existingByKey.get(combinationKey);
    const labels = combo.map((item) => ({
      attributeNameAr: item.attributeNameAr,
      valueNameAr: item.valueNameAr,
      colorHex: item.colorHex,
    }));
    const labelSuffix = combo.map((item) => item.valueNameAr).join(' / ');
    const extra = combo.reduce((sum, item) => sum + item.extraPrice, 0);
    const defaultSale = Math.max(0, args.listPrice + extra);
    const quantity = existing?.quantity ?? 0;
    const saleAmount = existing?.salePrice.amount ?? defaultSale;
    const costAmount = existing?.costPrice.amount ?? args.costPrice;
    const stockStatus =
      existing?.stockStatus ??
      stockStatusFromQty(quantity, args.defaultStockStatus ?? 'out_of_stock');

    return {
      id: existing?.id ?? newId('var'),
      combinationKey,
      sku: existing?.sku || `${args.productSku || 'SKU'}-${combo.map((c) => c.valueNameAr).join('-')}`.slice(0, 64),
      nameAr: `${args.productNameAr || 'منتج'} (${labelSuffix})`,
      attributeValueIds,
      attributeLabels: labels,
      salePrice: { amount: saleAmount, currency } satisfies Money,
      costPrice: { amount: costAmount, currency } satisfies Money,
      quantity,
      stockStatus,
      barcode: existing?.barcode,
      imageUrl: existing?.imageUrl,
      isActive: existing?.isActive ?? true,
    };
  });
}

export function totalVariantQuantity(variants: ProductVariant[]): number {
  return variants.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
}

export function resolveVariantBySelection(
  variants: ProductVariant[],
  selectedValueIds: string[],
): ProductVariant | undefined {
  if (variants.length === 0) return undefined;
  const key = buildCombinationKey(selectedValueIds);
  return variants.find((variant) => variant.combinationKey === key && variant.isActive);
}

export function cheapestActiveVariant(variants: ProductVariant[]): ProductVariant | undefined {
  const active = variants.filter((variant) => variant.isActive);
  if (active.length === 0) return undefined;
  return active.reduce((best, variant) =>
    variant.salePrice.amount < best.salePrice.amount ? variant : best,
  );
}

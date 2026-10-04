import type { ProductVariant } from '@/features/ecommerce/domain/types/product';

type VariantLabelSource = Pick<ProductVariant, 'nameAr' | 'attributeLabels' | 'sku'>;

/** Short label for warehouse lines — attributes only, not the full repeated product title. */
export function formatVariantCompactLabel(
  variant: VariantLabelSource,
  catalogProductName?: string,
): string {
  if (variant.attributeLabels?.length) {
    return variant.attributeLabels.map((row) => row.valueNameAr.trim()).filter(Boolean).join(' · ');
  }
  const name = variant.nameAr.trim();
  const base = catalogProductName?.trim();
  if (base && name.startsWith(base)) {
    let rest = name.slice(base.length).trim();
    if (rest.startsWith('(') && rest.endsWith(')')) {
      rest = rest.slice(1, -1);
    }
    return rest.replace(/\s*\/\s*/g, ' · ').trim() || name;
  }
  return name;
}

export function variantMatchesSearch(
  variant: VariantLabelSource,
  catalogProductName: string | undefined,
  term: string,
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  const compact = formatVariantCompactLabel(variant, catalogProductName).toLowerCase();
  const sku = (variant.sku ?? '').toLowerCase();
  const full = variant.nameAr.toLowerCase();
  return compact.includes(q) || sku.includes(q) || full.includes(q);
}

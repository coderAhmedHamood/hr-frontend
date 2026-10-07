import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

/** A scanned code resolved to a product (and its variant when the code is a variant's). */
export type ScannedItem = {
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  variantName?: string;
};

type ProductRow = { id: string; nameAr: string; sku: string; barcode?: string | null };
type VariantRow = {
  id: string;
  productId: string;
  nameAr: string;
  sku: string;
  barcode: string | null;
  isActive: boolean;
};

const same = (a: string | null | undefined, b: string) =>
  (a ?? '').trim().toLowerCase() === b.trim().toLowerCase();

async function products(companyId: string, query: Record<string, string | number>) {
  const res = await apiRequest<PaginatedResult<ProductRow>>('/inventory/products', {
    query: { companyId, page: 1, limit: 5, archiveScope: 'active', ...query },
    throwOnError: true,
  });
  return res.items ?? [];
}

async function variants(companyId: string, query: Record<string, string | number>) {
  const res = await apiRequest<PaginatedResult<VariantRow>>('/inventory/product-variants', {
    query: { companyId, page: 1, limit: 5, ...query },
    throwOnError: true,
  });
  return (res.items ?? []).filter((v) => v.isActive !== false);
}

async function withProduct(companyId: string, variant: VariantRow): Promise<ScannedItem> {
  const product = await apiRequest<ProductRow>(`/inventory/products/${variant.productId}`, {
    query: { companyId },
    throwOnError: true,
  });
  return {
    productId: variant.productId,
    productName: product?.nameAr ?? variant.nameAr,
    sku: variant.sku || product?.sku || '',
    variantId: variant.id,
    variantName: variant.nameAr,
  };
}

/**
 * What a scanned code points to: a variant's barcode, a product's barcode,
 * then an exact SKU (labels that print the SKU). Null when nothing matches
 * exactly — a partial match is never taken for a scan.
 */
export async function resolveScannedCode(
  companyId: string,
  rawCode: string,
): Promise<ScannedItem | null> {
  const code = rawCode.trim();
  if (!code || !companyId) return null;

  const byVariantBarcode = await variants(companyId, { barcode: code });
  if (byVariantBarcode[0]) return withProduct(companyId, byVariantBarcode[0]);

  const byProductBarcode = await products(companyId, { barcode: code });
  if (byProductBarcode[0]) {
    const p = byProductBarcode[0];
    return { productId: p.id, productName: p.nameAr, sku: p.sku };
  }

  const productSku = (await products(companyId, { search: code })).find((p) => same(p.sku, code));
  if (productSku) return { productId: productSku.id, productName: productSku.nameAr, sku: productSku.sku };

  const variantSku = (await variants(companyId, { search: code })).find((v) => same(v.sku, code));
  if (variantSku) return withProduct(companyId, variantSku);

  return null;
}

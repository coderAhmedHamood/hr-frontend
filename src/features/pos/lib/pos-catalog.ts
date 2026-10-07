import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { resolveScannedCode } from '@/features/catalog/products/lib/resolve-scanned-code';

/**
 * What the register sells, read from the products app (its API only; POS
 * never copies products). Read-only: nothing here writes to the catalog.
 */

export type PosCatalogProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
};

export type PosCatalogVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number | null;
};

type ProductRow = {
  id: string;
  nameAr: string;
  sku: string;
  barcode?: string | null;
  priceAmount: string | number;
  categoryId?: string | null;
  posAvailable?: boolean;
  saleOk?: boolean;
  status?: string;
};

type VariantRow = {
  id: string;
  productId: string;
  nameAr: string;
  sku: string;
  barcode: string | null;
  isActive: boolean;
  salePriceAmount?: string | number | null;
};

type MediaRow = { productId: string; url: string; isPrimary: boolean; position: number };

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export async function fetchPosProducts(
  companyId: string,
  options: { onlyPosAvailable: boolean },
): Promise<PosCatalogProduct[]> {
  const [products, media] = await Promise.all([
    apiRequest<PaginatedResult<ProductRow>>('/inventory/products', {
      query: {
        companyId,
        page: 1,
        limit: 500,
        archiveScope: 'active',
        status: 'active',
        posAvailable: options.onlyPosAvailable ? true : undefined,
      },
      throwOnError: true,
    }),
    apiRequest<PaginatedResult<MediaRow>>('/inventory/product-media', {
      query: { companyId, page: 1, limit: 2000, archiveScope: 'active' },
      silent: true,
    }).catch(() => null),
  ]);

  const imageByProduct = new Map<string, MediaRow>();
  for (const m of media?.items ?? []) {
    const current = imageByProduct.get(m.productId);
    if (!current || (m.isPrimary && !current.isPrimary) || m.position < current.position) {
      imageByProduct.set(m.productId, m);
    }
  }

  return (products.items ?? [])
    .filter((p) => p.saleOk !== false)
    .map((p) => ({
      id: p.id,
      name: p.nameAr,
      sku: p.sku,
      barcode: p.barcode ?? null,
      price: toNumber(p.priceAmount),
      categoryId: p.categoryId ?? null,
      imageUrl: imageByProduct.get(p.id)?.url ?? null,
    }));
}

export async function fetchPosVariants(companyId: string, productId: string): Promise<PosCatalogVariant[]> {
  const res = await apiRequest<PaginatedResult<VariantRow>>('/inventory/product-variants', {
    query: { companyId, productId, page: 1, limit: 200 },
    throwOnError: true,
  });
  return (res.items ?? [])
    .filter((v) => v.isActive !== false)
    .map((v) => ({
      id: v.id,
      productId: v.productId,
      name: v.nameAr,
      sku: v.sku,
      barcode: v.barcode,
      price: v.salePriceAmount == null || v.salePriceAmount === '' ? null : toNumber(v.salePriceAmount),
    }));
}

/** A scanned barcode or SKU: the existing exact-match resolver of the products app. */
export async function resolvePosScan(companyId: string, code: string) {
  return resolveScannedCode(companyId, code);
}

/** Sample items so the design can be reviewed without catalog data. */
export const DEMO_POS_PRODUCTS: PosCatalogProduct[] = [
  { id: 'demo-1', name: 'قهوة عربية 250 غ', sku: 'CF-250', barcode: '1000000000011', price: 35, categoryId: null, imageUrl: null },
  { id: 'demo-2', name: 'شاي أخضر', sku: 'TEA-GR', barcode: '1000000000028', price: 18, categoryId: null, imageUrl: null },
  { id: 'demo-3', name: 'تمر سكري 1 كغ', sku: 'DT-1K', barcode: '1000000000035', price: 42, categoryId: null, imageUrl: null },
  { id: 'demo-4', name: 'ماء معدني 330 مل', sku: 'WT-330', barcode: '1000000000042', price: 1.5, categoryId: null, imageUrl: null },
  { id: 'demo-5', name: 'عسل سدر 500 غ', sku: 'HN-500', barcode: '1000000000059', price: 120, categoryId: null, imageUrl: null },
  { id: 'demo-6', name: 'كوب حراري', sku: 'MUG-01', barcode: '1000000000066', price: 55, categoryId: null, imageUrl: null },
  { id: 'demo-7', name: 'بسكويت شوكولاتة', sku: 'BS-CH', barcode: '1000000000073', price: 6, categoryId: null, imageUrl: null },
  { id: 'demo-8', name: 'زيت زيتون 1 لتر', sku: 'OL-1L', barcode: '1000000000080', price: 48, categoryId: null, imageUrl: null },
];

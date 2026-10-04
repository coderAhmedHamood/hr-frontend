/**
 * Products (catalog) feature — public surface (phase 2.5).
 *
 * The catalog owns products, variants, categories, brands, attributes and
 * units of measure. Its screens are mounted by the store (`/products`, …) and
 * by inventory (`/inventory/products`, …); app routes import them from here.
 * Inventory sections (stock, cost, tracking, batches, moves) and store
 * sections (compare-at price, promos, stockStatus, reviews) show only when
 * that app is enabled for the company (`useProductAppSections`).
 */
export { ProductsListPage } from '@/features/catalog/products/components/products-list-page';
export { ProductDetailPage } from '@/features/catalog/products/components/product-detail-page';
export { CategoriesListPage } from '@/features/catalog/categories/components/categories-list-page';
export { BrandsListPage } from '@/features/catalog/brands/components/brands-list-page';
export { AttributesListPage } from '@/features/catalog/attributes/components/attributes-list-page';
export { CatalogUomsListPage } from '@/features/catalog/catalog-uoms/components/catalog-uoms-list-page';
export {
  productAppSectionsFor,
  useProductAppSections,
  visibleProductTabs,
  visibleRelatedDocs,
  type ProductAppSections,
} from '@/features/catalog/products/hooks/use-product-app-sections';

/**
 * Single in-memory catalog source of truth for Admin CMS + Storefront.
 *
 * Both `productsApi` / `categoriesApi` / `brandsApi` and storefront repositories
 * must use these stores — never call `createMockRepository` with the same seed twice.
 * HTTP cutover: replace this module with adapters that hit Admin / Storefront APIs.
 */
import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type { Product } from '@/features/ecommerce/domain/types/product';
import type { Category } from '@/features/ecommerce/domain/types/category';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import productsSeed from '@/features/ecommerce/shared/lib/mock/products.json';
import categoriesSeed from '@/features/ecommerce/shared/lib/mock/categories.json';
import brandsSeed from '@/features/ecommerce/shared/lib/mock/brands.json';

export const mockProductsStore = createMockRepository<Product>(productsSeed as Product[]);
export const mockCategoriesStore = createMockRepository<Category>(categoriesSeed as Category[]);
export const mockBrandsStore = createMockRepository<Brand>(brandsSeed as Brand[]);

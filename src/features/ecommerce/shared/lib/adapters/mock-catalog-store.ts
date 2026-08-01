/**
 * In-memory catalog for products until that HTTP cutover lands.
 * Categories/brands use public inventory APIs on the storefront.
 */
import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type { Product } from '@/features/ecommerce/domain/types/product';
import productsSeed from '@/features/ecommerce/shared/lib/mock/products.json';

export const mockProductsStore = createMockRepository<Product>(productsSeed as Product[]);
